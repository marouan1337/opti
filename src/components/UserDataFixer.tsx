'use client';

import { useEffect, useState } from 'react';

export default function UserDataFixer() {
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    const fixUserData = async () => {
      try {
        setStatus('Running fix-user-data...');
        const response = await fetch('/api/fix-user-data', { method: 'POST' });
        const data = await response.json();
        console.log('Fix user data result:', data);
        setStatus(data.success ? 'Data fixed successfully' : 'Error fixing data');
      } catch (error) {
        console.error('Failed to fix user data:', error);
        setStatus('Error fixing data');
      }
    };

    fixUserData();
  }, []);

  // This component doesn't render anything visible
  return null;
}
