/**
 * PANDU-NELAYAN Full-Stack Dev Launcher
 * Starts both Python FastAPI (port 8000) and Node/Vite Express (port 3000) concurrently.
 * Usage: node dev-full.mjs
 */
import { spawn } from 'child_process';

console.log('🚀 Starting PANDU-NELAYAN Full-Stack Dev Environment...\n');

// 1. Start Python FastAPI backend
const py = spawn('uvicorn', ['app:app', '--reload', '--port', '8000'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd(),
});

py.on('error', (err) => {
  console.error('❌ Python FastAPI failed to start:', err.message);
  console.error('   Make sure Python is installed and run: pip install -r requirements.txt');
});

// 2. Wait 2s for FastAPI to initialize, then start Vite/Express
setTimeout(() => {
  console.log('\n🌊 Starting Vite + Express dev server on port 3000...\n');
  const ts = spawn('npx', ['tsx', 'server.ts'], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd(),
  });

  ts.on('error', (err) => {
    console.error('❌ Vite/Express failed to start:', err.message);
  });

  ts.on('exit', (code) => {
    console.log(`\nVite/Express exited with code ${code}. Stopping FastAPI...`);
    py.kill();
    process.exit(code ?? 0);
  });
}, 2500);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down both servers...');
  py.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  py.kill();
  process.exit(0);
});
