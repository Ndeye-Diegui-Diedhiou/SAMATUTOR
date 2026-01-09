const request = require('supertest');
const assert = require('assert');
const app = require('../index');

(async function run() {
  try {
    // Mock global fetch to avoid network calls
    global.fetch = async () => ({
      status: 200,
      headers: { get: () => 'application/json' },
      text: async () => JSON.stringify({ choices: [{ message: { content: 'ok' } }] })
    });

    process.env.PROXY_KEY = 'testkey';
    process.env.ANTHROPIC_API_KEY = 'dummy'; // avoid server 500 due to missing upstream key in tests

    // 1) No proxy key -> 401
    let res = await request(app).post('/api/ai').send({ model: 'x', messages: [{ role: 'user', content: 'hi' }] });
    assert.strictEqual(res.status, 401, 'Expected 401 when proxy key missing');

    // 2) Wrong proxy key -> 401
    res = await request(app).post('/api/ai').set('x-proxy-key', 'bad').send({ model: 'x', messages: [{ role: 'user', content: 'hi' }] });
    assert.strictEqual(res.status, 401, 'Expected 401 when proxy key invalid');

    // 3) Correct key but invalid body -> 400
    res = await request(app).post('/api/ai').set('x-proxy-key', 'testkey').send({ model: 'x' });
    assert.strictEqual(res.status, 400, 'Expected 400 when payload invalid');

    // 4) Correct key & valid body -> 200
    res = await request(app).post('/api/ai').set('x-proxy-key', 'testkey').send({ model: 'x', messages: [{ role: 'user', content: 'hi' }] });
    console.log('valid request response status', res.status, 'body:', res.body, 'text:', res.text);
    assert.strictEqual(res.status, 200, 'Expected 200 for valid request');

    console.log('All proxy tests passed');
    process.exit(0);
  } catch (err) {
    console.error('Proxy tests failed:', err);
    process.exit(1);
  }
})();