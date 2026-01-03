/**
 * Keep Render Free Tier Awake
 * 
 * Pings your Render backend every 14 minutes to prevent it from spinning down.
 * Run this script locally or deploy it to a free service like Vercel Cron Jobs.
 * 
 * Usage:
 *   node keep-render-awake.js
 * 
 * Or set up as a cron job on cron-job.org (free service)
 */

const RENDER_API_URL = process.env.RENDER_API_URL || 'https://your-api.onrender.com';
const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes in milliseconds

async function pingServer() {
  try {
    const response = await fetch(`${RENDER_API_URL}/health`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Render-Keep-Awake-Bot',
      },
    });

    const timestamp = new Date().toISOString();
    
    if (response.ok) {
      console.log(`✅ [${timestamp}] Ping successful - Status: ${response.status}`);
    } else {
      console.log(`⚠️ [${timestamp}] Ping returned status: ${response.status}`);
    }
  } catch (error) {
    const timestamp = new Date().toISOString();
    console.error(`❌ [${timestamp}] Ping failed:`, error.message);
  }
}

// Initial ping
console.log('🚀 Starting Render keep-awake service...');
console.log(`📍 Target: ${RENDER_API_URL}`);
console.log(`⏰ Interval: Every 14 minutes\n`);
pingServer();

// Set up interval
setInterval(pingServer, PING_INTERVAL);
