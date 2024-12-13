import { promisify } from 'util';
import { createClient } from 'redis';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.isClientConnected = false;

    this.client.on('error', (err) => {
      console.error('Redis client error:', err);
    });

    this.client.on('connect', () => {
      this.isClientConnected = true;
    });
  }

  isAlive() {
    return this.isClientConnected;
  }

  async get(key) {
    try {
      return await promisify(this.client.GET).bind(this.client)(key);
    } catch (error) {
      console.error('Error getting key from Redis:', error);
    }
  }

  async set(key, value, duration) {
    try {
      await promisify(this.client.SETEX)
          .bind(this.client)(key, duration, value);
    } catch (error) {
      console.error('Error setting key in Redis:', error);
    }
  }

  async del(key) {
    try {
      await promisify(this.client.DEL).bind(this.client)(key);
    } catch (error) {
      console.error('Error deleting key from Redis:', error);
    }
  }
}

const redisClient = new RedisClient();
export default redisClient;
