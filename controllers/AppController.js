import redisClient from '../utils/redis.js';  // Import the Redis client
import dbClient from '../utils/db.js';  // Import the DB client

class AppController {
    // GET /status - Returns if Redis and DB are alive
    static async getStatus(req, res) {
        try {
            const redisStatus = redisClient.isAlive();  // Check if Redis is alive
            const dbStatus = dbClient.isAlive();  // Check if DB is alive

            // Return the status as a JSON response
            return res.status(200).json({
                redis: redisStatus,
                db: dbStatus
            });
        } catch (error) {
            console.error('Error checking status:', error);
            return res.status(500).json({ message: 'Error checking status' });
        }
    }

    // GET /stats - Returns the number of users and files
    static async getStats(req, res) {
        try {
            // Get the number of users and files from the database
            const users = await dbClient.nbUsers();
            const files = await dbClient.nbFiles();

            // Return the statistics as a JSON response
            return res.status(200).json({users, files});
        } catch (error) {
            console.error('Error fetching stats:', error);
            return res.status(500).json({ message: 'Error fetching stats' });
        }
    }
}

export default AppController;
