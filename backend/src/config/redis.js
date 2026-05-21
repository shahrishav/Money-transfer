const redis = require('redis');
require('dotenv').config();

const client = redis.createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 3) {
        console.log('❌ Redis not available - rate limiting disabled');
        return false;
      }
      return Math.min(retries * 500, 2000);
    }
  }
});

client.on('error', (err) => {
  // Only log once not every second
});

client.on('connect', () => {
  console.log('✅ Redis Connected');
});

client.on('ready', () => {
  console.log('✅ Redis Ready');
});

const connectRedis = async () => {
  try {
    await client.connect();
  } catch (err) {
    console.log('⚠️  Redis not connected - continuing without rate limiting');
  }
};

module.exports = { client, connectRedis };