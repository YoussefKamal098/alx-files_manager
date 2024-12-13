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
      if (!email) return res.status(400).json({ error: 'Missing email' });
      if (!password) return res.status(400).json({ error: 'Missing password' });

      // Check if user already exists
      const existingUser = await UsersController.checkIfUserExists(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Already exist' });
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
      return res.status(500).json({ error: 'Internal server error' });
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
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const user = await UsersController.getUserById(userId);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      return res.status(200).json({ id: user._id, email: user.email });
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
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
}

export default UsersController;
