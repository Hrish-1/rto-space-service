import jwt from 'jsonwebtoken';

const generateToken = userId => {
  const token = jwt.sign({ userId }, process.env.SECRET_KEY, {
    expiresIn: '1d',
  });

  return token
};

export default generateToken;
