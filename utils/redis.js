import { createClient } from 'redis';

class RedisClient {
    constructor() {
        this.client = createClient();
        this.client.on('error', (err) => {
            console.error('Redis client error:', err);
        });
        this.client.connect().catch((err) => {
            console.error('Failed to connect to Redis:', err);
        });
    }

    isAlive() {
        return this.client.isReady;
    }

    async get(key) {
        try {
            return await this.client.get(key);
        } catch (error) {
            console.error('Error getting key from Redis:', error);
            return null;
        }
    }

    async set(key, value, duration) {
        try {
            await this.client.set(key, value, {
                EX: duration
            });
        } catch (error) {
            console.error('Error setting key in Redis:', error);
        }
    }

    async del(key) {
        try {
            await this.client.del(key);
        } catch (error) {
            console.error('Error deleting key from Redis:', error);
        }
    }
}

const redisClient = new RedisClient();
export default redisClient;
