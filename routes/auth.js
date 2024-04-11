import express from 'express';
const router = express.Router();
import { login, register,forgotPassword } from '../services/authService.js';


router.post('/login', login);
router.post('/register', register);
router.post('/forgotpassword', forgotPassword);


export default router;
