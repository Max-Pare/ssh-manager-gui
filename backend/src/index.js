'use strict';

require('dotenv').config();

if (!process.env.ENCRYPTION_KEY) {
  console.error('');
  console.error('  ERROR: ENCRYPTION_KEY is not set.');
  console.error('  Copy .env.example to .env and set ENCRYPTION_KEY to a random 32+ character string.');
  console.error('');
  process.exit(1);
}

const http = require('http');
const express = require('express');
const WebSocket = require('ws');

const devicesRouter = require('./routes/devices');
const settingsRouter = require('./routes/settings');
const { handleTerminal } = require('./ws/terminal');
const poller = require('./poller');

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';

const app = express();

// CORS
app.use((req, res, next) => {
  const origin = NODE_ENV === 'production' ? ALLOWED_ORIGIN : '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());

// Health
app.get('/api/health', (req, res) => {
  res.json({ ok: true, version: '1.0.0' });
});

// Routes
app.use('/api/devices', devicesRouter);
app.use('/api/settings', settingsRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const server = http.createServer(app);

// WebSocket — SSH terminal
const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  const match = req.url.match(/^\/ws\/terminal\/(\d+)$/);
  if (!match) { socket.destroy(); return; }
  wss.handleUpgrade(req, socket, head, (ws) => {
    handleTerminal(ws, parseInt(match[1], 10));
  });
});

// Start
server.listen(PORT, () => {
  console.log(`ssh-mgr backend listening on :${PORT}`);
  poller.start();
});

// Graceful shutdown
function shutdown() {
  console.log('\nShutting down...');
  poller.stop();
  server.close(() => process.exit(0));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
