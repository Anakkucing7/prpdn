import assert from 'node:assert/strict';
import { test } from 'node:test';

test('public session checks use cookies and never call sign-out', async () => {
  const originalFetch = globalThis.fetch;
  const requests: { url: string; method: string; credentials?: RequestCredentials }[] = [];
  let authenticated = true;
  globalThis.fetch = async (input, init) => {
    requests.push({ url: String(input), method: init?.method ?? 'GET', credentials: init?.credentials });
    return Response.json(authenticated ? { user: { id: 'fixture', name: 'Akun uji' }, session: { id: 'fixture' } } : null);
  };
  try {
    const { authClient } = await import('./auth-client');
    const signedIn = await authClient.getSession();
    assert.equal(signedIn.data?.user.id, 'fixture');
    authenticated = false;
    const signedOut = await authClient.getSession();
    assert.equal(signedOut.data, null);
    assert.equal(requests.length, 2);
    assert.ok(requests.every(request => request.url.endsWith('/get-session') && request.method === 'GET' && request.credentials === 'include'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
