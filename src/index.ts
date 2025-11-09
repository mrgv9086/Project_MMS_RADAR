import express from 'express';
import dotenv from 'dotenv';

import apiRoutes from './routes/api';
import { errorHandler } from "./middleware/error_handler_middleware";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use('/api', apiRoutes);
app.use(errorHandler);

app.get('/', (req, res) => {
    res.json({
        message: 'File Storage Server is running!',
        timestamp: new Date().toISOString()
    });
});

app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
    console.log(`📚 API available at http://localhost:${port}/api`);
});
