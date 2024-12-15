import express from 'express';
import AppController from '../controllers/AppController';
import AuthController from '../controllers/AuthController';
import UsersController from '../controllers/UsersController';
import FilesController from '../controllers/FilesController';
import authenticate from '../middleware/auth';

const router = express.Router();

// Define the /status route to check Redis and DB status
router.get('/status', AppController.getStatus);
// Define the /stats route to get the number of users and files
router.get('/stats', AppController.getStats);

// POST /connect - AuthController.getConnect
router.get('/connect', AuthController.getConnect);
// GET /disconnect - AuthController.getDisconnect
router.get('/disconnect', authenticate, AuthController.getDisconnect);

// Endpoints for users
router.post('/users', UsersController.postNew);
// GET /users/me - UsersController.getMe
router.get('/users/me', authenticate, UsersController.getMe);

router.post('/files', authenticate, FilesController.postUpload);

// Endpoints for files
router.get('/files/:id', authenticate, FilesController.getShow);
router.get('/files', authenticate, FilesController.getIndex);

router.put('/files/:id/publish', authenticate, FilesController.putPublish);
router.put('/files/:id/unpublish', authenticate, FilesController.putUnpublish);

router.get('/files/:id/data', FilesController.getFile);

export default router;
