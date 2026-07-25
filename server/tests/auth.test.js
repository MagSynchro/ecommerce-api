const request = require('supertest');
const app = require('../src/app');
const pool = require('../../database/connection');

const testEmail = `auth-test-${Date.now()}@example.com`;
const testPassword = 'TestPass123!';
const agent = request.agent(app);

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email = $1', [testEmail]);
  await pool.end();
});

describe('Auth lifecycle', () => {
  test('registers a new user and logs them in', async () => {
    const res = await agent
      .post('/users/register')
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe(testEmail);
  });

  test('GET /users/me reflects the registered session, defaulting to role "user"', async () => {
    const res = await agent.get('/users/me');

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(testEmail);
    expect(res.body.role).toBe('user');
  });

  test('logout clears the session', async () => {
    await agent.post('/users/logout');

    const res = await agent.get('/users/me');
    expect(res.status).toBe(401);
  });

  test('logs back in with correct credentials', async () => {
    const res = await agent
      .post('/users/login')
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(testEmail);
  });

  test('rejects login with the wrong password', async () => {
    const res = await request(app)
      .post('/users/login')
      .send({ email: testEmail, password: 'the-wrong-password' });

    expect(res.status).toBe(401);
  });

  test('unauthenticated request to a protected route is rejected', async () => {
    const res = await request(app).get('/orders');
    expect(res.status).toBe(401);
  });
});
