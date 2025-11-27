// Basic test script (no test framework) to exercise key endpoints.
const fetch = require('node-fetch');

const base = 'http://79.116.36.78:4000/api';

async function run() {
  console.log('Pruebas básicas: suponiendo backend en http://79.116.36.78:4000');
  try {
    // 1) login
    const login = await fetch(base + '/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: process.env.ADMIN_USER || 'admin', password: process.env.ADMIN_PASS || 'changeme' })
    });
    console.log('/auth/login ->', login.status);
    const loginJson = await login.json();
    console.log('login response:', loginJson);

    // 2) list disks
    const disks = await fetch(base + '/disks', { headers: { 'Accept-Language': 'en' } });
    console.log('/disks ->', disks.status);
    console.log('disks:', await disks.json());

  } catch (e) {
    console.error('Error during tests', e);
  }
}

run();
