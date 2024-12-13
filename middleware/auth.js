import redisClient from '../utils/redis';

/**
 * Middleware to authenticate user based on token stored in Redis.
 */
const authenticate = async (req, res, next) => {
  const token = req.headers['x-token'];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Check if the token exists in Redis
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Attach userId to request for further use in controllers
    req.userId = userId;
    return next();
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export default authenticate;
