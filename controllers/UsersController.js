import express from 'express';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import { hashPasswordSha1 } from '../utils/hashUtils';

/**
 * UsersController handles the creation of users and related logic.
 */
class UsersController {
  /**
   * Handles the creation of a new user.
   * Expects an email and password in the request body.
   *
   * @param {express.Request} req - The Express request object.
   * @param {express.Response} res - The Express response object.
   * @returns {Promise<express.Response>} Express response object
   */
  static async postNew(req, res) {
    const { email, password } = req.body;

    try {
      // Validate input
      UsersController.validateInput(email, password);

      // Check if user already exists
      const existingUser = await UsersController.checkIfUserExists(email);
      if (existingUser) {
        return UsersController.errorResponse(res, 400, 'Already exists');
      }

      // Hash the password
      const hashedPassword = hashPasswordSha1(password);

      // Create the new user and insert into DB
      const newUser = await UsersController.createUser(email, hashedPassword);

      return res.status(201).json({
        id: newUser._id,
        email: newUser.email,
      });
    } catch (error) {
      return UsersController.errorResponse(res, error.status || 400, error.message || 'Error creating user');
    }
  }

  /**
   * Retrieves the authenticated user's details based on the token.
   *
   * @param {express.Request} req - Express request object
   * @param {express.Response} res - Express response object
   * @returns {Promise<express.Response>} Express response object
   */
  static async getMe(req, res) {
    const { userId } = req;

    if (!userId) {
      return UsersController.errorResponse(res, 401, 'Unauthorized');
    }

    try {
      const user = await UsersController.getUserById(userId);
      if (!user) {
        return UsersController.errorResponse(res, 401, 'Unauthorized');
      }

      return res.status(200).json({ id: user._id, email: user.email });
    } catch (error) {
      return UsersController.errorResponse(res, 500, 'Internal Server Error');
    }
  }

  /**
   * Validates the provided email and password.
   *
   * @param {string} email - The user's email.
   * @param {string} password - The user's password.
   * @throws {Error} If validation fails.
   */
  static validateInput(email, password) {
    if (!email) {
      throw { status: 400, message: 'Missing email' };
    }

    if (!password) {
      throw { status: 400, message: 'Missing password' };
    }
  }

  /**
   * Checks if a user already exists in the database by email.
   *
   * @param {string} email - The user's email.
   * @returns {Promise<Object|null>} - The user object if found, else null.
   */
  static async checkIfUserExists(email) {
    const usersCollection = await dbClient.usersCollection();
    return usersCollection.findOne({ email });
  }

  /**
   * Creates a new user in the database.
   *
   * @param {string} email - The user's email.
   * @param {string} hashedPassword - The user's hashed password.
   * @returns {Promise<Object>} - The created user object.
   */
  static async createUser(email, hashedPassword) {
    const usersCollection = await dbClient.usersCollection();
    const result = await usersCollection.insertOne({ email, password: hashedPassword });
    return { _id: result.insertedId, email };
  }

  /**
   * Retrieves a user from the database by their user ID.
   *
   * @param {string} userId - The user's ID.
   * @returns {Promise<Object|null>} - The user object if found, else null.
   */
  static async getUserById(userId) {
    const usersCollection = await dbClient.usersCollection();
    return usersCollection.findOne({ _id: new ObjectId(userId) });
  }

  /**
   * Sends an error response.
   *
   * @param {express.Response} res - Express response object.
   * @param {number} status - HTTP status code.
   * @param {string} message - Error message.
   * @returns {express.Response} - The error response.
   */
  static errorResponse(res, status, message) {
    return res.status(status).json({ error: message });
  }
}

export default UsersController;
