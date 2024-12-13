import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';

const router = express.Router();

// Define the /status route to check Redis and DB status
router.get('/status', AppController.getStatus);

// Define the /stats route to get the number of users and files
router.get('/stats', AppController.getStats);

// New endpoint to create a user
router.post('/users', UsersController.postNew);

export default router;
