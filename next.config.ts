import type { NextConfig } from "next";

// Custom initialization function to run migrations
const runDatabaseMigrations = async () => {
  if (process.env.RUN_MIGRATIONS === 'true') {
    console.log('Running database migrations during build...');
    try {
      // Import and run migrations
      const { runMigrations } = require('./src/lib/db-migrations');
      await runMigrations();
      console.log('Database migrations completed successfully');
    } catch (error) {
      console.error('Error running migrations during build:', error);
      // Don't fail the build if migrations fail
    }
  }
};

// Run migrations before build if needed
if (process.env.RUN_MIGRATIONS === 'true') {
  runDatabaseMigrations();
}

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    },
  }
};

export default nextConfig;
