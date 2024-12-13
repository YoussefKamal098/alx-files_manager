import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { verifyPassword } from '../utils/hashUtils';

/**
 * AuthController handles user authentication logic.
 */
class AuthController {
  /**
     * Signs in a user by generating an authentication token.
     * Expects Authorization header with Basic Auth credentials (Base64 encoded).
     *
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     */
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(400).json({ error: 'Bad request' });
    }

    // Decode the Base64 encoded email:password
    const base64Credentials = authHeader.split(' ')[1]; // Extract credentials after 'Basic '
    const decodedCredentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    // Extract password and email
    const sepPos = decodedCredentials.indexOf(':');
    const email = decodedCredentials.substring(0, sepPos);
    const password = decodedCredentials.substring(sepPos + 1);

    if (!email || !password) {
      return res.status(400).json({ error: 'Bad request' });
    }

    // Find user by email and compare password
    const usersCollection = await dbClient.usersCollection();
    const existingUser = await usersCollection.findOne({ email });

    if (!existingUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Hash the provided password and compare it with the stored password
    if (!verifyPassword(password, existingUser.password)) {
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
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
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
