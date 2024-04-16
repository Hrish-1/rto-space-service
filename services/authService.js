import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import Employ from '../models/employ.js'
import ejs from "ejs";
import path from 'path';
import { fileURLToPath } from 'url';

// Helper function to create an email transporter
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  secureConnection: false,
  secure: false, // TLS requires secureConnection to be false,
  port: 587,
  auth: {
    user: process.env.EMAIL_TO_SEND_MAILS_FROM,
    pass: process.env.MAIL_PASS
  }
});

const forgotPassword = async (req, res, next) => {

  try {
    const { email } = req.body;
    console.log("hitt")
    let token;
    let existingClient;
    if (email) {
      existingClient = await Employ.findOne({ email });
    }

    if (!existingClient) {
      return res.status(400).json({ success: false, message: 'Client not found' });
    }

    const payload = { clientId: existingClient._id };
    token = jwt.sign({ data: payload }, process.env.SECRET_KEY, {
      expiresIn: '24h',
    });
    console.log('token', token)
    console.log(process.env.SECRET_KEY, 'process.env.SECRET_KEY', token)

    const __dirname = path.dirname(fileURLToPath(import.meta.url));

    let template = await ejs.renderFile(path.join(__dirname, '..', "/views/forgotpassword.ejs"), {
      token: token,
    });
    const result = await sendPasswordResetEmail({ to: email, subject: "password reset", html: template });

    res.json({ success: true, message: 'Email Sent Successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'error occured' });

  }


};

const sendPasswordResetEmail = async (mailOption) => {
  try {
    console.log(mailOption, 'mailOption', process.env.RESET_LINK)
    let mail = {};
    mail.from = process.env.EMAIL_TO_SEND_MAILS_FROM;
    mail.subject = mailOption.subject ? mailOption.subject : 'Password Reset Link';
    mail.to = mailOption.to;
    mail.cc = mailOption.cc;
    if (mailOption.html) {
      mail.html = mailOption.html
    } else if (mailOption.text) {
      mail.text = mailOption.text;
    } else {
      mail.html =
        `<p>Please click on <a href=${process.env.RESET_LINK}${mailOption.token}>link</a>.
     You will be redirected to change password link</p>`
    }
    mail.attachments = mailOption.attachments ? mailOption.attachments : []
    await transporter.sendMail(mail);
  }
  catch (error) {
    console.log(error);
    return error;
  }
}





export {
  login,
  register,
  forgotPassword
};
