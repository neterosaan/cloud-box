import express from 'express';
import cors from 'cors';

import folderRoutes from '../src/features/folders/foldersRoutes.js'

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/folders',folderRoutes)

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});

export default app;

