const request = require('supertest');
const app = require('../src/app');
const pool = require('../../database/connection');

const adminEmail = `admin-test-${Date.now()}@example.com`;
const userEmail = `user-test-${Date.now()}@example.com`;
const password = 'TestPass123!';

const adminAgent = request.agent(app);
const userAgent = request.agent(app);

let createdProductId;

beforeAll(async () => {
  await adminAgent.post('/users/register').send({ email: adminEmail, password });
  await userAgent.post('/users/register').send({ email: userEmail, password });

  // role is re-read from the DB on every request (deserializeUser), not cached
  // in the session, so promoting after login is enough -- no re-login needed.
  await pool.query("UPDATE users SET role = 'admin' WHERE email = $1", [adminEmail]);
});

afterAll(async () => {
  if (createdProductId) {
    await pool.query('DELETE FROM products WHERE id = $1', [createdProductId]);
  }
  await pool.query('DELETE FROM users WHERE email = ANY($1)', [[adminEmail, userEmail]]);
  await pool.end();
});

describe('Admin authorization', () => {
  test('non-admin is forbidden from creating a product', async () => {
    const res = await userAgent
      .post('/products')
      .send({ name: `Forbidden Product ${Date.now()}`, price: 1, description: 'x' });

    expect(res.status).toBe(403);
  });

  test('admin can create a product', async () => {
    const res = await adminAgent
      .post('/products')
      .send({ name: `Admin Test Widget ${Date.now()}`, price: 9.99, description: 'created by test' });

    expect(res.status).toBe(201);
    expect(res.body.is_active).toBe(true);
    createdProductId = res.body.id;
  });

  test('deactivating hides the product from the public list but not from includeInactive', async () => {
    const del = await adminAgent.delete(`/products/${createdProductId}`);
    expect(del.status).toBe(204);

    const publicList = await request(app).get('/products');
    expect(publicList.body.some((p) => p.id === createdProductId)).toBe(false);

    const fullList = await request(app).get('/products?includeInactive=true');
    expect(fullList.body.some((p) => p.id === createdProductId)).toBe(true);
  });

  test('reactivating brings it back into the public list', async () => {
    const reactivate = await adminAgent
      .put(`/products/${createdProductId}`)
      .send({ is_active: true });

    expect(reactivate.status).toBe(200);
    expect(reactivate.body.is_active).toBe(true);

    const publicList = await request(app).get('/products');
    expect(publicList.body.some((p) => p.id === createdProductId)).toBe(true);
  });

  test('non-admin is forbidden from updating order status', async () => {
    const res = await userAgent.put('/orders/999999/status').send({ status: 'shipped' });
    expect(res.status).toBe(403);
  });

  test('admin request with an invalid status is rejected', async () => {
    const res = await adminAgent.put('/orders/999999/status').send({ status: 'not-a-real-status' });
    expect(res.status).toBe(400);
  });

  test('non-admin is forbidden from issuing a refund', async () => {
    const res = await userAgent.post('/orders/999999/refund').send({});
    expect(res.status).toBe(403);
  });
});
