import express from 'express';
import AppController from '../controllers/AppController.js';  // Import AppController

const router = express.Router();

// Define the /status route to check Redis and DB status
router.get('/status', AppController.getStatus);

// Define the /stats route to get the number of users and files
router.get('/stats', AppController.getStats);

export default router;
