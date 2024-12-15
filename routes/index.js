import express from 'express';
import AppController from '../controllers/AppController';
import AuthController from '../controllers/AuthController';
import UsersController from '../controllers/UsersController';
import FilesController from '../controllers/FilesController';
import authenticateMiddleware from '../middlewares/authMiddleware';
import validateFilePostUploadRequestBodyMiddleware from '../middlewares/validateFilePostUploadRequestBodyMiddleware';
import validateUserPostNewRequestBodyMiddleware from '../middlewares/validateUserPostNewRequestBodyMiddleware';

const router = express.Router();

// Define the /status route to check Redis and DB status
router.get('/status', AppController.getStatus);
// Define the /stats route to get the number of users and files
router.get('/stats', AppController.getStats);

// POST /connect - AuthController.getConnect
router.get('/connect', AuthController.getConnect);
// GET /disconnect - AuthController.getDisconnect
router.get('/disconnect', authenticateMiddleware, AuthController.getDisconnect);

// Endpoints for users
router.post('/users', validateUserPostNewRequestBodyMiddleware, UsersController.postNew);
// GET /users/me - UsersController.getMe
router.get('/users/me', authenticateMiddleware, UsersController.getMe);

router.post('/files', authenticateMiddleware, validateFilePostUploadRequestBodyMiddleware, FilesController.postUpload);

// Endpoints for files
router.get('/files/:id', authenticateMiddleware, FilesController.getShow);
router.get('/files', authenticateMiddleware, FilesController.getIndex);

router.put('/files/:id/publish', authenticateMiddleware, FilesController.putPublish);
router.put('/files/:id/unpublish', authenticateMiddleware, FilesController.putUnpublish);

router.get('/files/:id/data', FilesController.getFile);

export default router;
