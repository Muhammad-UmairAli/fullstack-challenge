import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/database/prisma.service.js';

/**
 * End-to-end auth flow against a real PostgreSQL database.
 * Requires DATABASE_URL and JWT secrets (see apps/api/.env.example) and an
 * up-to-date schema (`pnpm --filter @repo/database db:deploy`).
 */
describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const email = `e2e-${Date.now()}@example.com`;
  const password = 'Password123';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = configureApp(moduleRef.createNestApplication());
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma?.user.deleteMany({ where: { email } });
    await app?.close();
  });

  const http = () => request(app.getHttpServer());

  it('GET /api/v1/health/ready reports the database as up', async () => {
    const res = await http().get('/api/v1/health/ready').expect(200);
    expect(res.body).toMatchObject({
      success: true,
      data: { status: 'ok', database: 'up' },
    });
  });

  it('rejects invalid registration payloads with field errors', async () => {
    const res = await http()
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: 'weak' })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.errors).toHaveProperty('email');
    expect(res.body.errors).toHaveProperty('password');
  });

  it('runs register -> login -> me -> refresh -> reuse detection -> logout', async () => {
    const registered = await http()
      .post('/api/v1/auth/register')
      .send({ email, password, name: 'E2E User' })
      .expect(201);
    expect(registered.body.data).toMatchObject({ email });
    expect(registered.body.data).not.toHaveProperty('password');

    // Unique index violation surfaces as 409 through the Prisma driver adapter.
    await http()
      .post('/api/v1/auth/register')
      .send({ email, password })
      .expect(409);

    const login = await http()
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    const { accessToken, refreshToken } = login.body.data as {
      accessToken: string;
      refreshToken: string;
    };

    const me = await http()
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(me.body.data).toMatchObject({ email, name: 'E2E User' });
    expect(me.body.data).not.toHaveProperty('password');

    const refreshed = await http()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(200);
    const rotated = refreshed.body.data.refreshToken as string;
    expect(rotated).not.toBe(refreshToken);

    // A second request with the same token right away (parallel browser requests)
    // is within the grace window and still succeeds.
    await http()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    // Once the grace window has passed, replaying it is treated as theft: it fails
    // and every session for the user is revoked, including the rotated one.
    await prisma.refreshToken.updateMany({
      where: { user: { email }, rotatedAt: { not: null } },
      data: { rotatedAt: new Date(Date.now() - 60_000) },
    });
    await http()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(401);
    await http()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: rotated })
      .expect(401);

    await http()
      .post('/api/v1/auth/logout')
      .send({ refreshToken: rotated })
      .expect(200);
  });

  it('rejects requests without a valid access token', async () => {
    await http().get('/api/v1/auth/me').expect(401);
    await http()
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer not-a-jwt')
      .expect(401);
  });
});
