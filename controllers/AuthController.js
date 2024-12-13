import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { verifyPasswordSha1 } from '../utils/hashUtils';
import { decodeAuthHeader } from '../utils/authUtils';

/**
 * AuthController handles user authentication logic.
 */
class AuthController {
  /**
     * Signs in a user by generating an authentication token.
     * Expects Authorization header with Basic Auth credentials (Base64 encoded).
     *
     * @param {express.Request} req - Express request object
     * @param {express.Response} res - Express response object
     * @returns {Promise<express.Response>} Express response object
     */
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Decode email and password from the Authorization header
    const { email, password } = decodeAuthHeader(authHeader);
    if (!email || !password) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find user by email and compare password
    const usersCollection = await dbClient.usersCollection();
    const existingUser = await usersCollection.findOne({ email });

    if (!existingUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Hash the provided password and compare it with the stored password
    if (!verifyPasswordSha1(password, existingUser.password)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Generate a random token
    const token = uuidv4();
    // Store the token in Redis for 24 hours
    await redisClient.set(`auth_${token}`, existingUser._id.toString(), 24 * 60 * 60); // 86400 seconds = 24 hours

    return res.status(200).json({ token });
  }

  /**
     * Signs out the user by removing the token from Redis.
     *
     * @param {express.Request} req - Express request object
     * @param {express.Response} res - Express response object
     * @returns {Promise<express.Response>} Express response object
     */
  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Remove the token from Redis
    await redisClient.del(`auth_${token}`);

    return res.status(204).send(); // No content
  }
}

export default AuthController;
