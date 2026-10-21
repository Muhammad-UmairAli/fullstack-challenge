import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { proxy } from './proxy';

const fetchMock = jest.fn<typeof fetch>();
global.fetch = fetchMock;

function request(path: string, cookies: Record<string, string> = {}) {
  const cookie = Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: cookie ? { cookie } : {},
  });
}

function apiResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

afterEach(() => {
  fetchMock.mockReset();
});

describe('proxy', () => {
  it('lets requests with an access token through', async () => {
    const res = await proxy(request('/', { access_token: 'a' }));

    expect(res.headers.get('x-middleware-next')).toBe('1');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('redirects signed-in users away from auth pages', async () => {
    const res = await proxy(request('/login', { access_token: 'a' }));

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/');
  });

  it('allows anonymous access to auth pages', async () => {
    const res = await proxy(request('/login'));

    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('redirects to login and clears cookies without a session', async () => {
    const res = await proxy(request('/'));

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(
      'http://localhost:3000/login?redirect=%2F',
    );
    expect(res.cookies.get('refresh_token')?.value).toBe('');
  });

  it('refreshes the session and exposes new tokens to the same render', async () => {
    fetchMock.mockResolvedValue(
      apiResponse(200, {
        success: true,
        data: { accessToken: 'new-access', refreshToken: 'new-refresh' },
      }),
    );

    const res = await proxy(request('/', { refresh_token: 'old-refresh' }));

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('http://api.test/api/v1/auth/refresh');
    expect(JSON.parse(String(init?.body))).toEqual({
      refreshToken: 'old-refresh',
    });

    // Browser receives the rotated cookies...
    expect(res.cookies.get('access_token')?.value).toBe('new-access');
    expect(res.cookies.get('refresh_token')?.value).toBe('new-refresh');
    // ...and Server Components in this request see them via the request override.
    expect(res.headers.get('x-middleware-request-cookie')).toContain(
      'access_token=new-access',
    );
  });

  it('keeps a non-persistent session non-persistent after rotation', async () => {
    fetchMock.mockResolvedValue(
      apiResponse(200, {
        data: { accessToken: 'new-access', refreshToken: 'new-refresh' },
      }),
    );

    const res = await proxy(
      request('/', { refresh_token: 'old', session_only: '1' }),
    );

    expect(res.cookies.get('refresh_token')?.maxAge).toBeUndefined();
  });

  it('falls back to login when the refresh is rejected', async () => {
    fetchMock.mockResolvedValue(apiResponse(401, { success: false }));

    const res = await proxy(request('/', { refresh_token: 'revoked' }));

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('falls back to login when the API is unreachable', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    const res = await proxy(request('/', { refresh_token: 'any' }));

    expect(res.status).toBe(307);
  });
});
