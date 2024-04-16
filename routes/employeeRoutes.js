import express from 'express';
const router = express.Router();
import { authEmployee, getEmployee, me, registerEmployee, updateEmployee } from '../services/employeeService.js'
import auth from '../layers/authLayer.js';


router.post('/auth', authEmployee)
router.post('', registerEmployee)
// gets the information of authenticated user
router.get('/me', auth, me)
router.get('/:id', auth, getEmployee)
router.put('/:id', auth, updateEmployee)

export default router
