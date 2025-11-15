const { spawn } = require('child_process');

// Start server
const server = spawn('node', ['server.js'], {
  stdio: 'inherit'
});

// Start workers
const workers = spawn('node', ['startWorkers.js'], {
  stdio: 'inherit'
});

// Handle errors
server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

workers.on('error', (err) => {
  console.error('Workers error:', err);
  process.exit(1);
});

// Handle exit
process.on('SIGTERM', () => {
  server.kill();
  workers.kill();
  process.exit(0);
});

console.log('🚀 Starting server and workers...');