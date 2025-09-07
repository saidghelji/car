const puppeteer = require('puppeteer');
const assert = require('assert');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const BASE = process.env.FRONTEND_URL || 'http://localhost:5174';
  const API_BASE = process.env.API_BASE || 'http://localhost:5000';

  try {
    console.log('Opening frontend:', BASE);
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });

    // Fill login form
    await page.type('#username', 'admin');
    await page.type('#password', 'changeme');
    await Promise.all([
      page.click('button[type=submit]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }),
    ]);

    // Wait for localStorage token
    const token = await page.evaluate(() => localStorage.getItem('token'));
    assert(token && token.length > 10, 'Token not found in localStorage');
    console.log('Token found in localStorage');

    // Check header username presence
    const usernameText = await page.evaluate(() => {
      const el = document.querySelector('header .text-sm');
      return el ? el.textContent : null;
    });

    assert(usernameText && usernameText.toLowerCase().includes('admin'), 'Header username not found');
    console.log('Header shows username:', usernameText);

    console.log('UI test passed');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('UI test failed', err);
    await browser.close();
    process.exit(1);
  }
})();
