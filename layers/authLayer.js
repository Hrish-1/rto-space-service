import jwt from 'jsonwebtoken';

const auth = async (req, res, next) => {
    try {
        console.log(req.headers.authorization,'req.headers.authorization')
        // Typically, the token is sent in the "Authorization" header as "Bearer {token}"
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
        }

        // Extract the token
        const token = authHeader.split(' ')[1];

        // Verify the token
        // const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const decoded = jwt.verify(token, process.env.SECRET_KEY);

        // If token is valid, attach the user payload to the request object
        // This can be useful in subsequent middleware or route handlers to identify the user
        req.user = decoded.data;

        // Proceed to the next middleware/route handler
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid token. Access denied.' });
        } else {
            console.error(error);
            return res.status(500).json({ success: false, message: 'An error occurred while processing your request.' });
        }
    }
};

export default auth;
