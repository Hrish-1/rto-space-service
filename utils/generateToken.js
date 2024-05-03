import jwt from 'jsonwebtoken';

const generateToken = (userInfo) => {
  const token = jwt.sign({ ...userInfo }, process.env.SECRET_KEY, {
    expiresIn: '1d',
  });

  return token
};

export default generateToken;
