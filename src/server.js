require('dotenv').config();

const express = require('express');

const app = express();

const PORT = process.env.PORT || 3000;

app.get('/health', (_, res) => {
  res.json({
    status: 'ok',
  });
});

app.get('/health/db', async (_, res) => {
  try {
    await pool.query('SELECT NOW()');

    return res.json({
      status: 'ok',
      database: 'connected',
    });
  } catch {
    return res.status(500).json({
      status: 'error',
      database: 'disconnected',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});