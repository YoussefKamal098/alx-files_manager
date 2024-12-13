import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { verifyPasswordSha1 } from '../utils/hashUtils';
import decodeBasicAuthHeader from '../utils/authUtils';

/**
 * AuthController handles user authentication logic.
 */
class AuthController {
  /**
   * Signs in a user by generating an authentication token.
   * Expects Authorization header with Basic Auth credentials (Base64 encoded).
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @returns {Promise<object>} Express response object.
   */
  static async getConnect(req, res) {
    try {
      const { email, password } = await AuthController.authenticate(req);

      const user = await AuthController.findUserByEmail(email);
      if (!user || !AuthController.isPasswordValid(password, user.password)) {
        return AuthController.unauthorizedResponse(res);
      }

      const token = await AuthController.generateToken(user._id);
      return res.status(200).json({ token });
    } catch (error) {
      return AuthController.unauthorizedResponse(res);
    }
  }

  /**
   * Signs out the user by removing the token from Redis.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @returns {Promise<object>} Express response object.
   */
  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return AuthController.unauthorizedResponse(res);
    }

    // Remove the token from Redis
    await redisClient.del(`auth_${token}`);
    return res.status(204).send(); // No content
  }

  /**
   * Extracts and decodes the authorization header to retrieve email and password.
   * @returns {Promise<{email: string, password: string}>} - Returns decoded email and password
   */
  static async authenticate(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new Error('Unauthorized');
    }

    const { decodedEmail, decodedPassword } = decodeBasicAuthHeader(authHeader);

    if (!decodedEmail || !decodedPassword) {
      throw new Error('Unauthorized');
    }

    return { email: decodedEmail, password: decodedPassword };
  }

  /**
   * Finds a user by email in the database.
   *
   * @param {string} email - The user's email.
   * @returns {Promise<Object|null>} - The user object if found, else null.
   */
  static async findUserByEmail(email) {
    const usersCollection = await dbClient.usersCollection();
    return usersCollection.findOne({ email });
  }

  /**
   * Validates if the provided password matches the stored password.
   *
   * @param {string} providedPassword - The password provided by the user.
   * @param {string} storedPassword - The password stored in the database.
   * @returns {boolean} - True if passwords match, false otherwise.
   */
  static isPasswordValid(providedPassword, storedPassword) {
    return verifyPasswordSha1(providedPassword, storedPassword);
  }

  /**
   * Generates a token and stores it in Redis for 24 hours.
   *
   * @param {string} userId - The user's ID.
   * @returns {Promise<string>} - The generated token.
   */
  static async generateToken(userId) {
    const token = uuidv4();
    await redisClient.set(`auth_${token}`, userId.toString(), 24 * 60 * 60); // 86400 seconds = 24 hours
    return token;
  }

  /**
   * Sends an unauthorized response.
   */
  static unauthorizedResponse(res) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

export default AuthController;
