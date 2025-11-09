import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth_middleware';
import AuthController from "../controllers/auth_controller";
import StorageController from "../controllers/storage_controller";

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);

router.post('/storage', authenticateJWT, StorageController.createStorage);
router.get('/storage', authenticateJWT, StorageController.getAvailableStorages);
router.delete('/storage', authenticateJWT, StorageController.deleteStorage);

// GET /api/hello - Hello World endpoint
router.get('/hello', (req, res) => {
    res.json({
        message: 'Hello World from File Storage API!',
        status: 'success',
        timestamp: new Date().toISOString()
    });
});

// GET /api/info - Информация о сервере
router.get('/info', authenticateJWT, (req, res) => {
    res.json({
        name: 'File Storage Server',
        version: '1.0.0',
        description: 'Server for file storage with authorization',
        author: 'Your Name'
    });
});

export default router;