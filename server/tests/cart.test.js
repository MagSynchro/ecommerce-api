const request = require('supertest');
const app = require('../src/app');
const pool = require('../../database/connection');

const testEmail = `cart-test-${Date.now()}@example.com`;
const testPassword = 'TestPass123!';
const agent = request.agent(app);

let productAId;
let productBId;

beforeAll(async () => {
  await agent.post('/users/register').send({ email: testEmail, password: testPassword });

  // Self-contained fixtures rather than relying on seed.sql having been run.
  const productA = await pool.query(
    `INSERT INTO products (name, price, description) VALUES ($1, 1, 'test fixture') RETURNING id`,
    [`Cart Test Product A ${Date.now()}`]
  );
  const productB = await pool.query(
    `INSERT INTO products (name, price, description) VALUES ($1, 1, 'test fixture') RETURNING id`,
    [`Cart Test Product B ${Date.now()}`]
  );
  productAId = productA.rows[0].id;
  productBId = productB.rows[0].id;
});

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email = $1', [testEmail]);
  await pool.query('DELETE FROM products WHERE id = ANY($1)', [[productAId, productBId]]);
  await pool.end();
});

describe('Cart', () => {
  // Regression test: cart_items previously had no UNIQUE(user_id, product_id)
  // constraint, so the ON CONFLICT upsert in POST /cart threw a 42P10 on any
  // repeat add of the same product.
  test('adding the same product twice increments quantity instead of erroring', async () => {
    const first = await agent.post('/cart').send({ product_id: productAId, quantity: 1 });
    expect(first.status).toBe(201);
    expect(first.body.quantity).toBe(1);

    const second = await agent.post('/cart').send({ product_id: productAId, quantity: 2 });
    expect(second.status).toBe(201);
    expect(second.body.quantity).toBe(3);
  });

  test('cart/sync merges guest cart items without erroring', async () => {
    const res = await agent
      .post('/cart/sync')
      .send({ items: [{ product_id: productBId, quantity: 2 }] });

    expect(res.status).toBe(200);

    const cart = await agent.get('/cart');
    const synced = cart.body.find((item) => item.product_id === productBId);
    expect(synced).toBeDefined();
    expect(synced.quantity).toBe(2);
  });
});
