import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Employ from '../models/employ.js'
import { HttpCodes, Messages } from '../helpers/static.js'


const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        console.log(email, password)


        // Check if the required fields are present
        if (!email || !password) {
            return res.status(HttpCodes.BadRequest).json({ success: false, message: Messages.MissingFields });
        }

        let existingClient;
        if (email) {
            existingClient = await Employ.findOne({ email });
            console.log(existingClient,'Employ')
        }

        if (!existingClient) {
            return res.status(HttpCodes.NotFound).json({ success: false, message: Messages.UserNotFound });
        }
        console.log(password, existingClient.password,'qqqqqqqqqqqqqq')

        // Check if the provided password matches the stored password
        const passwordMatch = await bcrypt.compare(password, existingClient.password);

        if (!passwordMatch) {
            return res.status(HttpCodes.BadRequest).json({ success: false, message: Messages.IncorrectPassword });
        }
        // Generate a JWT token
        const payload = { clientId: existingClient._id };
        const token = jwt.sign({ data: payload }, process.env.SECRET_KEY, {
            expiresIn: '24h',
        });


        return res.status(200).json({
            userToken: token,
            success: true,
            message: Messages.UserNotFound,
        });
    } catch (err) {
        console.error(err);
        return res.status(HttpCodes.InternalServerError).json({ success: false, message: Messages.InternalServerError });
    }
};


const register = async (req, res, next) => {
    try {
<<<<<<< HEAD
=======
        let userId;
>>>>>>> 7ff7495 (auth funtionality)
        const { email, password } = req.body;

        console.log(req.body)

        // return

        if (!email && !password) {
            return res.status(HttpCodes.BadRequest).json({ success: false, message: Messages.BadRequest });
        }

        let existingClient = await Employ.findOne({ email });

        if (existingClient) {
            return res.status(HttpCodes.Conflict).json({ success: false, message: Messages.UserAlreadyExists });
        }
        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        // Create a new client document
        // const newClient = new publisherUser({ email, password: hashedPassword });
        const newClient = await Employ.create({
            email,
            password: hashedPassword
        })

<<<<<<< HEAD
     await newClient.save();
=======
        const ans = await newClient.save();

>>>>>>> 7ff7495 (auth funtionality)


        res.status(HttpCodes.Created).json({
            success: true,
            message: Messages.RegistrationSuccess,
        });
    } catch (error) {
        console.log(error,"error")
        res.status(HttpCodes.InternalServerError).json({ success: false, message: Messages.InternalServerError });
    }
};



export {
    login,
    register
};
