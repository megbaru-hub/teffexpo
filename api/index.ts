import express from 'express';

const app = express();

app.get('/api/health', (req, res) => {
  res.json({ status: 'success', message: 'Server is running' });
});

app.get('*', (req, res) => {
  res.send('OK');
});

export default app;
