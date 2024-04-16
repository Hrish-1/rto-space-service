import express from 'express';
const router = express.Router();
import { forgotPassword } from '../services/authService.js';

router.post('/forgotpassword', forgotPassword);


export default router;
