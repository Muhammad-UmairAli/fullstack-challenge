# ADR-0001: Real-time synchronization layer

| Field    | Value                                                                                                 |
| -------- | ----------------------------------------------------------------------------------------------------- |
| Status   | Proposed                                                                                              |
| Date     | 2026-10-21                                                                                            |
| Deciders | To be assigned: engineering lead, security reviewer, platform/infrastructure owner                    |
| Owner    | To be assigned                                                                                        |
| Scope    | Boilerplate infrastructure. Applies to every project created from this repository.                    |
| Related  | [Backend](../backend.md), [Frontend](../frontend.md), [Auth review](../auth-implementation-review.md) |

## Purpose

Define how projects built on this boilerplate push data changes to connected users in real time: which components are added, how they interact with the existing BFF authentication model, and what must be in place before implementation starts.

The web app in this repository is a placeholder. This ADR covers reusable infrastructure only: no application-specific features.

## Context

### Requirements

When one user creates, updates or deletes shared data, other users who are allowed to see that data must see the change without refreshing. The solution must handle:

1. Multiple users viewing or editing the same data at the same time.
2. Conflicts when users make overlapping changes.
3. Connection interruptions, automatic reconnection and delivery of missed updates.
4. Access control: users receive only updates they are authorized to see.
5. Performance and scalability as concurrent users grow.
6. Automated tests proving updates propagate reliably across sessions.

### Current architecture (verified in this repository)

- **BFF pattern.** The browser never calls the API. Next.js Server Actions, Server Components and `proxy.ts` call the NestJS API server-side (`apps/web/lib/api.ts`). Access (15 min) and refresh (7 day) JWTs live in HttpOnly cookies on the web origin, so browser JavaScript cannot read them.
- **Writes go through REST.** NestJS 11 controllers validate input with shared Zod schemas (`@repo/validators`) and persist through a single global `PrismaService` (Prisma 7, PostgreSQL, `pg` driver adapter).
- **Authorization is ownership only.** Resources carry a `userId` owner. There are no tenants, memberships or roles, and some reads are public.
- **Session lifecycle.** Refresh tokens rotate with reuse detection. Logout and password reset revoke refresh tokens.
- **Rate limiting.** A global per-client limit applies, with `TRUST_PROXY` controlling how the client IP is derived.
- **No shared cache or message broker.** There is no Redis or queue, and no metrics or tracing.
- **Infrastructure in the repo.** Local development uses Docker Compose with PostgreSQL only. CI runs on GitHub Actions with a PostgreSQL service container.

### Forces and constraints

- The design must be generic: channels and permissions are defined per project, not hard-coded.
- It should use the existing stack and team skills (NestJS, Prisma, PostgreSQL) and stay aligned with AWS or Azure managed services.
- It must not weaken the BFF security model, where tokens never reach browser JavaScript.
- Delivery must survive process crashes, deploys and multi-instance scaling.

## Decision

Add a real-time layer to the API with these parts:

1. **Change log (transactional outbox).** A `ChangeEvent` table written in the same database transaction as every shared-data mutation.
2. **Relay.** A background worker publishes committed change events to clients at least once.
3. **Real-time gateway.** A NestJS Socket.IO gateway using the WebSocket transport only. Clients subscribe to named channels (Socket.IO rooms).
4. **Cross-instance fan-out.** The Socket.IO Redis Streams adapter, backed by managed Redis.
5. **Connection tickets.** A short-lived, single-use ticket that the BFF obtains for the browser, because the browser cannot present its HttpOnly session to the API.
6. **Shared policy service.** One authorization component answers "may this user read this channel or resource", for both REST and the gateway.
7. **Optimistic concurrency.** Every mutable shared resource has a `version` column. Writes that are based on a stale version are rejected with HTTP 409.
8. **Cursor-based catch-up.** Clients resume from the last change event they processed. When the gap is too old, the server tells them to resync.

Writes stay on REST via the BFF. The socket carries server-to-client events plus lightweight client messages (subscribe, unsubscribe, presence).

### Architecture overview

```text
                 Server Actions / RSC                REST (private network)
  Browser ────────────────────────────▶ Next.js BFF ─────────────────────────▶ NestJS API
     │                                    │                                    │  same transaction:
     │                                    │ POST /realtime/tickets             │  domain write
     │                                    ▼  (with access token)               │  + ChangeEvent row
     │                               single-use ticket                         ▼
     │                                                                     PostgreSQL
     │  wss://<api>/realtime  (ticket in handshake auth)                        │
     └──────────────────────────────▶ Real-time gateway  ◀─── Relay ◀──────────┘
                                       (Socket.IO rooms)        (reads unpublished events)
                                             ▲
                                             │ Redis Streams adapter
                                             ▼
                                        Managed Redis ◀──▶ other API / gateway instances
```

### Event model

`ChangeEvent` (Prisma model sketch; final names decided during implementation):

| Column         | Purpose                                                                 |
| -------------- | ----------------------------------------------------------------------- |
| `id` (bigint)  | Monotonic cursor. Clients store the last id they processed per channel. |
| `channel`      | Routing key, for example `tenant:{id}` or `resource:{type}:{id}`.       |
| `resourceType` | Logical type, for example `project`.                                    |
| `resourceId`   | Identifier of the changed record.                                       |
| `operation`    | `created`, `updated` or `deleted`.                                      |
| `version`      | Resource version after the change; used for ordering and dedupe.        |
| `actorId`      | User who made the change, so clients can ignore their own echoes.       |
| `payload`      | Minimal delta (changed fields) or `null` for notify-then-fetch.         |
| `createdAt`    | Used for the retention window.                                          |
| `publishedAt`  | Set by the relay; `null` means not yet delivered.                       |

A shared helper, for example `changes.record(tx, event)`, is called inside Prisma interactive transactions. Domain code never emits socket events directly.

### Delivery

- **Relay.** The relay claims unpublished rows with `SELECT ... FOR UPDATE SKIP LOCKED`, emits each to its channel through the Socket.IO server (the adapter fans out to every instance), then sets `publishedAt`. Several API instances can run the relay safely.
- **Latency.** Polling runs at a short interval. A PostgreSQL `NOTIFY` after insert may be added later as a wake-up signal to reduce latency without changing the delivery guarantees.
- **Guarantee.** Delivery is at least once. Clients deduplicate by event `id` and ignore events whose `version` is not newer than their local copy. That handles both duplicates and out-of-order arrival.
- **Retention.** A scheduled job prunes the change log after a fixed window (initial proposal: 7 days, configurable).

### Channels and authorization

- **Channel naming.** Each project defines its channels through a registry. The boilerplate ships the mechanism plus one per-user channel `user:{id}` (session notices, revocations).
- **Policy interface.** The policy service exposes one interface, for example `canRead(user, channel | resource): Promise<boolean>`. REST guards and the gateway's subscribe handler both call it. This ADR does not define rules beyond ownership; see Prerequisite P1.
- **Subscribing.** On `subscribe`, the gateway checks the policy before joining the room.
- **Permission changes.** When permissions change (for example a membership is removed), the change is itself a `ChangeEvent` on the affected user's channel. The gateway re-evaluates and removes the socket from rooms it may no longer read.
- **Payload strategy.**
  - A delta payload is allowed only when everyone who may join the channel may see every field in it.
  - Otherwise the event carries no data (notify-then-fetch), and the client refetches through the BFF, where the normal REST authorization applies.

### Connection authentication

1. The browser calls a Server Action, for example `getRealtimeTicket()`.
2. Running server-side, that action calls `POST /realtime/tickets` on the API with the user's access token. The proxy has already refreshed the token if needed.
3. The API returns a random, single-use ticket bound to the user and session, valid for about 60 seconds. Only its hash is stored, matching how refresh tokens are handled.
4. The browser opens the socket and passes the ticket in the Socket.IO handshake `auth` object, never in the URL, so it does not appear in access logs.
5. The gateway validates and consumes the ticket, checks the `Origin` header against an allowlist (to block cross-site WebSocket hijacking), and binds the socket to the user.
6. Sockets carry an expiry aligned with the access-token lifetime. Before it lapses, the server sends `reauth`; the client fetches a new ticket and sends it. Otherwise the server disconnects.
7. Logout, password reset, user deactivation and refresh-token reuse detection publish a revocation to `user:{id}`, and the gateway disconnects that user's sockets.

### Conflict handling

- Every mutable shared resource has an integer `version`, incremented on each write.
- Clients send the version they edited, as an `If-Match` header or a `version` body field. The update runs as a conditional write (`WHERE id = ? AND version = ?`).
- **On zero rows updated,** the API returns `409 Conflict` with the current resource, and the client resolves the conflict: reapply, merge, or discard.
- **Avoiding conflicts.** Presence messages (who is viewing or editing a resource) reduce collisions. They are ephemeral and are not stored in the change log.
- **Rich text.** Real-time collaborative editing of rich text (CRDTs such as Yjs) is out of scope for the baseline. A project that needs it adds it as an opt-in module.

### Reconnection and catch-up protocol

| Message (direction)                                | Meaning                                                                                            |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `subscribe { channel, since? }` (client to server) | Join a channel. `since` is the last processed event id.                                            |
| `event { id, channel, ... }` (server to client)    | A change event, live or replayed.                                                                  |
| `caught_up { channel, cursor }` (server to client) | Replay finished; live events follow.                                                               |
| `resync_required { channel }` (server to client)   | `since` is older than retention; the client must reload a snapshot over REST and then resubscribe. |
| `reauth` / `reauth { ticket }` (both directions)   | Session renewal before socket expiry.                                                              |

- Socket.IO reconnection (exponential backoff with jitter) handles transport recovery.
- Socket.IO connection state recovery may replay very short gaps, but it is best-effort, so the change log is the source of truth for catch-up.
- Replays are authorized, paginated and capped per request.

### Scaling and operations

- **Stateless instances.** The API and gateway processes hold no state; Redis Streams carries fan-out, so any instance can serve any socket.
- **No sticky sessions.** HTTP long-polling is disabled, so sticky load-balancer sessions are not required.
- **Load balancer.** It must support WebSocket upgrades. Its idle timeout must exceed the Socket.IO heartbeat interval.
- **Deploys.** On `SIGTERM`, instances stop accepting new sockets and close existing ones so clients reconnect elsewhere. The API already enables Nest shutdown hooks.
- **Protection limits:**
  - per-socket message rate limits;
  - a maximum number of subscriptions per socket;
  - a maximum payload size;
  - coalescing of rapid successive updates to the same resource.
- **Deployment shape.** The gateway starts as a module inside `apps/api`, structured so it can move to its own deployable (`apps/realtime`) when connection count, rather than request volume, drives scaling.
- **Metrics:**
  - connected sockets and connections per instance;
  - subscribe denials;
  - relay lag (commit to emit) and the backlog of unpublished change events;
  - reconnect rate;
  - replay sizes;
  - 409 rate.

## Options considered

### Option A: Socket.IO gateway + transactional outbox + Redis Streams (chosen)

| Dimension        | Assessment                                                                        |
| ---------------- | --------------------------------------------------------------------------------- |
| Complexity       | Medium: new gateway, relay, change log and Redis                                  |
| Cost             | Managed Redis plus slightly larger API instances for connection memory            |
| Scalability      | Horizontal; bounded mainly by Redis throughput and per-instance connection memory |
| Team familiarity | High: NestJS has first-class gateways; Socket.IO is widely used                   |

**Pros:** Two-way channel for presence and subscriptions. Rooms, acknowledgements, heartbeats and reconnection come built in. No sticky sessions with WebSocket-only transport. Every committed change is delivered at least once.

**Cons:** New infrastructure (Redis) and a public real-time endpoint. Socket.IO's own protocol requires its client library, so plain WebSocket clients cannot connect.

### Option B: Server-Sent Events from the API + transactional outbox

| Dimension        | Assessment                                                            |
| ---------------- | --------------------------------------------------------------------- |
| Complexity       | Low to medium                                                         |
| Cost             | Similar to A (fan-out still needs a broker at more than one instance) |
| Scalability      | Good with HTTP/2; HTTP/1.1 limits concurrent connections per origin   |
| Team familiarity | High                                                                  |

**Pros:** Plain HTTP. Built-in reconnection with `Last-Event-ID`, which maps directly to the change-log cursor. Simpler client.

**Cons:** Server-to-client only, so presence and subscription changes need separate HTTP calls. Fewer built-in primitives (rooms, acknowledgements).

**When to prefer it:** projects that only ever need server-to-client push.

### Option C: Managed real-time service (for example Azure Web PubSub or AWS API Gateway WebSocket APIs)

| Dimension        | Assessment                                       |
| ---------------- | ------------------------------------------------ |
| Complexity       | Low to operate; medium to integrate              |
| Cost             | Per connection and per message; grows with usage |
| Scalability      | Very high, scaled by the provider                |
| Team familiarity | Varies by provider                               |

**Pros:** No connection scaling to operate. Works with serverless hosting.

**Cons:** Vendor lock-in; usage-based cost; the change log, catch-up protocol and authorization are still needed; local development and testing are harder.

**When to prefer it:** projects hosted on serverless platforms, or with very large connection counts.

### Option D: PostgreSQL LISTEN/NOTIFY only (no Redis)

| Dimension        | Assessment                                                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Complexity       | Low                                                                                                                                 |
| Cost             | No new infrastructure                                                                                                               |
| Scalability      | Limited: notification payload size limit, a single shared notification queue, and a dedicated session-level connection per listener |
| Team familiarity | Medium                                                                                                                              |

**Pros:** Fewest moving parts.

**Cons:** Not suited as the baseline for growth. It also conflicts with transaction-mode connection poolers, because listeners need session-level connections.

### Sub-decisions

| Concern                | Chosen                                                                                        | Alternatives                                                  | Reason                                                                                                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Publishing changes     | Transactional outbox + relay                                                                  | Emit after commit; change data capture (for example Debezium) | Emitting after commit drops events if the process dies after commit. Change data capture is heavy infrastructure for a baseline.                                           |
| Socket.IO adapter      | Redis Streams adapter                                                                         | Redis pub/sub adapter; Postgres adapter                       | Socket.IO documents connection state recovery as compatible with the Redis Streams adapter but not with Redis pub/sub; the Postgres adapter is listed as work in progress. |
| Conflict strategy      | Optimistic concurrency (`version`, 409)                                                       | Last write wins; CRDTs                                        | Last write wins silently loses edits. CRDTs are only justified for collaborative text.                                                                                     |
| Event payload          | Delta when the channel audience matches the field-level audience; otherwise notify-then-fetch | Always full payload; always notify-then-fetch                 | Balances latency against the risk of leaking fields to users who may not see them.                                                                                         |
| Browser authentication | Single-use ticket minted through the BFF                                                      | Same-origin path routing so the API reads the session cookie  | Tickets work across origins and hosting setups without load-balancer path rules, and keep tokens out of browser JavaScript.                                                |

## Trade-off analysis

- **Reliability over minimal infrastructure.** The outbox, relay and Redis add moving parts. In exchange, no committed change is silently lost, and clients can always catch up or resync. For a boilerplate that many projects inherit, predictable correctness is worth the extra components.
- **Security boundary change.** Today the API is reachable only by the Next.js server. The real-time endpoint must be publicly reachable. Mitigations:
  - expose only the `/realtime` path; REST stays private;
  - single-use tickets and an `Origin` allowlist;
  - re-authorization on expiry and disconnection on revocation.
- **Operational cost.** Teams must run Redis and monitor relay lag and connection counts. Projects that only need server push can choose Option B at the transport layer and keep the rest of this design.
- **Developer experience.** Domain code only calls `changes.record(tx, ...)` and the policy service. Transport, fan-out and catch-up stay inside the shared layer.

## Consequences

**Easier**

- New projects get real-time sync, catch-up and conflict detection by recording change events instead of hand-building socket code.
- One policy service keeps REST and real-time authorization consistent.
- Horizontal scaling of API instances without sticky sessions.

**Harder**

- Every shared-data mutation must run in a transaction that also records a change event. Missing calls mean missing updates; enforce it with a lint rule or code review checklist.
- Mutable shared resources need a `version` column, and clients must handle 409 responses.
- Local development and CI need Redis in addition to PostgreSQL.
- The API gains a public endpoint, which is in scope for security review and penetration testing.

**To revisit**

- Splitting the gateway into its own deployable once connection count dominates scaling.
- Moving to a managed real-time service if hosting moves to serverless.
- Change-log retention and partitioning once write volume is known.
- Adding CRDT-based collaborative editing as an opt-in module.

## Prerequisites

These must be completed or decided before implementation starts.

| ID  | Prerequisite                                                                                                                                                                                                                                                  | Type                      | Decision needed from                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ----------------------------------- |
| P1  | **Generic authorization model.** Define tenancy (for example workspace), memberships, roles, and the shared policy service interface. Today only resource ownership exists.                                                                                   | Architecture + product    | Engineering lead, product owner     |
| P2  | **Hosting.** Run the API on a long-lived container platform (for example Amazon ECS/Fargate, Azure Kubernetes Service or Azure Container Apps) behind a load balancer that supports WebSockets. Serverless functions are not suitable for socket connections. | Infrastructure            | Platform owner                      |
| P3  | **Network exposure.** Publish only `/realtime` (for example `wss://api.<domain>/realtime`) with TLS and an `Origin` allowlist; keep REST private.                                                                                                             | Security + infrastructure | Security reviewer, platform owner   |
| P4  | **Redis.** A managed instance per environment (for example Amazon ElastiCache or Azure Cache for Redis), plus a Redis service in `docker-compose.yml` and in CI.                                                                                              | Infrastructure + cost     | Platform owner, budget owner        |
| P5  | **Schema conventions.** A `version` column on mutable shared resources, the `ChangeEvent` table with a retention job, and a shared helper for version-checked updates.                                                                                        | Architecture              | Engineering lead                    |
| P6  | **Session revocation events.** Logout, password reset, deactivation and refresh-token reuse detection must publish revocations so sockets are disconnected.                                                                                                   | Architecture + security   | Engineering lead, security reviewer |
| P7  | **Observability.** Add OpenTelemetry metrics and tracing, so relay lag and delivery latency can be measured. The boilerplate has none today.                                                                                                                  | Infrastructure            | Platform owner                      |
| P8  | **Dependency review.** Confirm current versions and NestJS 11 compatibility of `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`, `socket.io-client` and `@socket.io/redis-streams-adapter`; check maintenance status and pin them.             | Engineering               | Engineering lead                    |

## Phasing

### Phase 0: Prerequisites

Complete P1 to P8. Exit criteria:

- authorization model approved;
- hosting and network exposure signed off by security;
- Redis available in every environment;
- observability baseline running.

### Phase 1: Core real-time layer

- `ChangeEvent` model, migration, recording helper and retention job.
- Relay with `FOR UPDATE SKIP LOCKED`.
- Socket.IO gateway (WebSocket only) with the Redis Streams adapter.
- Ticket endpoint and Server Action; handshake validation and `Origin` allowlist.
- Subscribe, replay, `caught_up`, `resync_required` and `reauth` protocol.
- Optimistic concurrency helper and the 409 response contract.
- Session revocation hooks (P6).
- Client SDK in a shared package (connection, cursor storage, dedupe, resync), plus test helpers.

**Exit criteria:** the Phase 1 tests listed under Testing strategy pass in CI.

### Phase 2: Scale and operate

- Multi-instance tests in CI, load tests at target connection counts, dashboards and alerts.
- Graceful drain on deploy.
- Rate limits and caps.
- Capacity guidance per instance size.

**Exit criteria:** latency and connection targets met under load (targets set per project); runbook written.

### Phase 3: Optional modules

- Presence (who is viewing or editing).
- Gateway as a separate deployable.
- CRDT-based collaborative editing.
- A managed real-time transport adapter for serverless hosting.

Each module ships behind configuration so projects opt in.

## Testing strategy

**Unit**

- Policy decisions.
- Optimistic-concurrency conflict detection.
- Change-event mapping.
- Replay pagination and the retention boundary.
- Ticket validation: expiry, single use, origin mismatch.

**Integration** (Jest e2e with PostgreSQL and Redis service containers, and at least two `socket.io-client` instances signed in as different users):

- an authorized client receives create, update and delete events within a time limit;
- an unauthorized client receives nothing and is denied on subscribe;
- concurrent updates with the same `version` produce exactly one success and one 409;
- disconnect, perform changes, reconnect with `since`, and receive exactly the missed events with no gaps;
- a `since` older than retention yields `resync_required`;
- removing a user's access or revoking their session removes or disconnects their socket;
- killing the process between commit and emit still delivers the event through the relay.

**Multi-instance**

- Two API instances share Redis, with clients connected to different instances; events cross instances.

**Browser end-to-end**

- Playwright with two signed-in browser contexts asserts UI updates without reload.
- `context.setOffline(true/false)` covers offline recovery.

**Load and resilience**

- k6 or Artillery measuring 95th and 99th percentile delivery latency at target connection counts.
- Restart Redis and kill instances during load, then verify recovery and catch-up.

**Shipped with the boilerplate**

- A socket test client factory.
- `waitForEvent(socket, predicate, timeoutMs)`.
- Fixtures for a second user, so every new project starts with propagation tests.

## Assumptions and items requiring validation

**Facts**

- The "Current architecture" section reflects this repository as of the date above.
- Socket.IO documents connection state recovery as supported by the in-memory, Redis Streams and MongoDB adapters, not by the Redis pub/sub adapter, with the Postgres adapter marked work in progress ([Socket.IO docs](https://socket.io/docs/v4/connection-state-recovery)).

**Assumptions**

- Projects need two-way messaging (presence) often enough to justify Socket.IO over Server-Sent Events.
- The API runs on long-lived containers.
- Typical shared records are small structured data rather than long collaborative documents.

**Requires validation before implementation**

- Package versions and NestJS 11 compatibility (P8).
- The PostgreSQL `NOTIFY` payload limit, if used as a relay wake-up ([PostgreSQL docs](https://www.postgresql.org/docs/current/sql-notify.html)).
- Default load balancer idle timeouts on the chosen platform, and Socket.IO's default heartbeat interval.
- Redis sizing and cost for the expected event volume.
- Security review of the public real-time endpoint (P3).

## Action items

1. [ ] Assign deciders and an owner; move this ADR to Accepted or revise it.
2. [ ] Draft the authorization model ADR (P1); this ADR depends on it.
3. [ ] Confirm hosting, network exposure and Redis provisioning (P2 to P4) with the platform owner and security reviewer.
4. [ ] Complete the dependency review (P8).
5. [ ] Add OpenTelemetry (P7).
6. [ ] Break Phase 1 into tickets in the project tracker.

## References

- Socket.IO connection state recovery: https://socket.io/docs/v4/connection-state-recovery
- NestJS WebSocket gateways: https://docs.nestjs.com/websockets/gateways
- NestJS WebSocket adapters: https://docs.nestjs.com/websockets/adapter
- PostgreSQL `NOTIFY`: https://www.postgresql.org/docs/current/sql-notify.html
- Transactional outbox pattern: https://microservices.io/patterns/data/transactional-outbox.html
