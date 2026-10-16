const express = require('express');
const sequelize = require('./config/database');
require('./models/Student');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use('/api/v1/auth', authRoutes);

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', message: 'CouPreshFund API is running' });
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    await sequelize.sync();
    console.log('Tables ready');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
  }
};

startServer();