import express from 'express';
import cors from 'cors';
import folderRoutes from './features/folders/foldersRoutes.js'
import fileRoutes from './features/files/filesRoutes.js';
import uploadRoutes from './features/uploads/uploadsRoutes.js';  
import tagRoutes from './features/tags/tagsRoutes.js'
import trashRoutes from './features/trash/trashRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/folders',folderRoutes)
app.use('/api/files',fileRoutes)
app.use('/api/uploads',uploadRoutes); 
app.use('/api/tags',tagRoutes)

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});

export default app;

