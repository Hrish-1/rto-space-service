import jwt from 'jsonwebtoken';
import asyncHandler from '../layers/asyncHandler.js';
import Employee from '../models/employee.js';

const auth = asyncHandler(async (req, res, next) => {
    let token

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1]

            const decoded = jwt.verify(token, process.env.SECRET_KEY)

            req.user = await Employee.findById(decoded.userId).select('-password')

            next()
        } catch (error) {
            console.error(error)
            switch (error.name) {
                case 'TokenExpiredError':
                    res.status(401)
                    throw new Error('Token expired. Please login again.')
                case 'JsonWebTokenError':
                    res.status(401)
                    throw new Error('Invalid token. Access denied.')
                default:
                    throw error
            }
        }
    }

    if (!token) {
        res.status(401)
        throw new Error('Not authorized, no token found')
    }
})

export default auth;
