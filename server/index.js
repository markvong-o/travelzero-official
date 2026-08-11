import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

try {
  process.loadEnvFile();
} catch {
  // No .env file present — runs fully mocked, which is the default.
}

import store from './store.js';
import sessionRoutes from './routes/session.js';
import authRoutes from './routes/auth.js';
import accountRoutes from './routes/account.js';
import assistantRoutes from './routes/assistant.js';
import securityRoutes from './routes/security.js';
import experimentRoutes from './routes/experiments.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 4001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/session', sessionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/experiments', experimentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`TravelZero server listening on http://localhost:${PORT}`);
  console.log(`Session store initialized with ${Object.keys(store.sessions).length} sessions`);
});
