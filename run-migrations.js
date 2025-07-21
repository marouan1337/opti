// Simple script to run migrations using Node.js directly
const { execSync } = require('child_process');
const path = require('path');

console.log('Running database migrations...');

try {
  // Run the Next.js app with a special environment variable to trigger migrations
  process.env.RUN_MIGRATIONS = 'true';
  
  // Execute the next.js build command which will trigger the migrations
  console.log('Starting Next.js build to run migrations...');
  execSync('npx next build', { 
    stdio: 'inherit',
    env: { ...process.env, RUN_MIGRATIONS: 'true' }
  });
  
  console.log('Migrations completed successfully');
} catch (error) {
  console.error('Error running migrations:', error);
  process.exit(1);
}
