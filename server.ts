import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  runPanduNelayanSimulation,
  SimulationInput,
} from './src/utils/maritimeFormulas.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Server-side Dual-Engine AI & Microeconomic Simulation API
  app.post('/api/predict', (req, res) => {
    try {
      const input = req.body as SimulationInput;
      const result = runPanduNelayanSimulation(input);
      res.json({ ok: true, data: result });
    } catch (error: any) {
      res.status(400).json({
        ok: false,
        error: error?.message || 'Gagal menjalankan simulasi PANDU-NELAYAN.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PANDU-NELAYAN server running on http://localhost:${PORT}`);
  });
}

startServer();
