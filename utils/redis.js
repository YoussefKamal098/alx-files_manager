import { promisify } from 'util';
import { createClient } from 'redis';

/**
 * RedisClient class manages the connection to Redis and provides methods to interact with Redis.
 * It handles the connection, checking if the client is connected, and provides utility functions
 * to interact with Redis (get, set, delete keys).
 */
class RedisClient {
  /**
   * Creates an instance of RedisClient and connects to the Redis server.
   * Sets the initial state of the connection and binds event handlers for
   * connection errors and success.
   */
  constructor() {
    this.client = createClient();
    this.isClientConnected = false;

    // Event listener for connection errors
    this.client.on('error', (err) => {
      console.error('Redis client error:', err);
    });

    // Event listener for successful connection
    this.client.on('connect', () => {
      this.isClientConnected = true;
    });
  }

  /**
   * Checks if the Redis client is connected and alive.
   * @returns {boolean} Returns true if the client is connected, otherwise false.
   */
  isAlive() {
    return this.isClientConnected;
  }

  /**
   * Gets the value associated with a key from Redis.
   * @param {string} key The key whose value needs to be fetched.
   * @returns {Promise<string|null>} A promise that resolves to the value of
   * the key or null if not found.
   */
  async get(key) {
    return promisify(this.client.GET).bind(this.client)(key);
  }

  /**
   * Sets a value for a key in Redis with a specified expiration time.
   * @param {string} key The key to set.
   * @param {string} value The value to set.
   * @param {number} duration The expiration time in seconds.
   * @returns {Promise<void>} A promise that resolves once the key-value pair is set in Redis.
   */
  async set(key, value, duration) {
    return promisify(this.client.SETEX).bind(this.client)(key, duration, value);
  }

  /**
   * Deletes a key from Redis.
   * @param {string} key The key to delete.
   * @returns {Promise<void>} A promise that resolves once the key is deleted.
   */
  async del(key) {
    await promisify(this.client.DEL).bind(this.client)(key);
  }
}

// Create and export an instance of RedisClient
const redisClient = new RedisClient();
export default redisClient;
