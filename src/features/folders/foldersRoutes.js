import express from 'express';
import { requireAuth } from '../../middlewares/authMiddleware.js';
const router = express.Router();

router.get('/test', (req, res) => {
    res.json({ message: "Folders feature is working!" });
});

router.get('/test2',requireAuth,(req,res)=>{
    res.json({ 
        message: "Folders feature is working!",
        user: req.user // 
    })
})


export default router;