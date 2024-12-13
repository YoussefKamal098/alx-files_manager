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
     * Responds with appropriate error messages or the created user object.
     *
     * @param {Object} req - The Express request object.
     * @param {Object} res - The Express response object.
     */
  static async postNew(req, res) {
    const { email, password } = req.body;

    // Check if email is provided
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    // Check if password is provided
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    // Check if the email already exists in the DB
    const usersCollection = await dbClient.usersCollection();
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Already exist' });
    }

    // Hash the password using the utility function
    const hashedPassword = hashPasswordSha1(password);

    // Create the new user object
    const newUser = { email, password: hashedPassword };

    // Insert the new user into the database
    const result = await usersCollection.insertOne(newUser);

    // Respond with the created user (without password)
    return res.status(201).json({
      id: result.insertedId,
      email: newUser.email,
    });
  }

  /**
   * Retrieves the authenticated user's details based on the token.
   *
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  static async getMe(req, res) {
    const { userId } = req;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find the user by userId
    const usersCollection = await dbClient.usersCollection();
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Return user details (email and id only)
    return res.status(200).json({ id: user._id, email: user.email });
  }
}

export default UsersController;
