import jwt from 'jsonwebtoken';

const generateToken = ({ userId, level }) => {
  const token = jwt.sign({ userId, level }, process.env.SECRET_KEY, {
    expiresIn: '1d',
  });

  return token
};

export default generateToken;
