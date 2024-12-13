import express from 'express';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

/**
 * AppController handles the application-related routes such as
 * checking status and fetching stats.
 */
class AppController {
  /**
   * This method checks the connection status of both Redis and the database
   * and returns a JSON response indicating their health.
   *
   * @param {express.Request} req - Express request object
   * @param {express.Response} res - Express response object
   * @returns {Promise<express.Response>} Express response object
   */
  static async getStatus(req, res) {
    try {
      // Check if Redis is alive
      const redisStatus = redisClient.isAlive();
      // Check if DB is alive
      const dbStatus = dbClient.isAlive();

      // Return the status as a JSON response
      return res.status(200).json({
        redis: redisStatus,
        db: dbStatus,
      });
    } catch (error) {
      console.error('Error checking status:', error);
      return res.status(500).json({ message: 'Error checking status' });
    }
  }

  /**
   * This method fetches the number of users and files stored in the database
   * and returns them in a JSON response.
   *
   * @param {express.Request} req - Express request object
   * @param {express.Response} res - Express response object
   * @returns {Promise<express.Response>} Express response object
   */
  static async getStats(req, res) {
    try {
      // Fetch the number of users from the DB
      const users = await dbClient.nbUsers();
      // Fetch the number of files from the DB
      const files = await dbClient.nbFiles();

      // Return the statistics as a JSON response
      return res.status(200).json({ users, files });
    } catch (error) {
      console.error('Error fetching stats:', error);
      return res.status(500).json({ message: 'Error fetching stats' });
    }
  }
}

export default AppController;
