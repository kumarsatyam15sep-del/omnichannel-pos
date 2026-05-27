import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) {
      // stop retrying and emit error
      return null;
    }
    return Math.min(times * 100, 2000);
  }
});

redis.on('connect', () => {
  console.log('Redis client connected');
});

redis.on('error', (err) => {
  console.error('Redis client error:', err.message);
});

// Immediately try to connect asynchronously
redis.connect().catch((err) => {
  console.error('Redis initial connection failed:', err.message);
});

export default redis;
