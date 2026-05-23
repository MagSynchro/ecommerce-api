const express = require('express');
const session = require('express-session');
const passport = require('passport');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const cors = require("cors");
require('./config/passport');

const app = express();

app.use(express.json());

app.use(cors({
  origin: process.env.FRONT_END_SERVER,
  credentials: true
}));

app.use(session({
  secret: 'dev_secret',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/carts');
const orderRoutes = require('./routes/orders');

app.use('/users', userRoutes);
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

module.exports = app;