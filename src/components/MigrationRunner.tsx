'use client';

import { useEffect } from 'react';

export default function MigrationRunner() {
  useEffect(() => {
    const runMigrations = async () => {
      try {
        const response = await fetch('/api/migrations', { method: 'POST' });
        const data = await response.json();
        console.log('Migration result:', data);
      } catch (error) {
        console.error('Failed to run migrations:', error);
      }
    };

    runMigrations();
  }, []);

  // This component doesn't render anything
  return null;
}
