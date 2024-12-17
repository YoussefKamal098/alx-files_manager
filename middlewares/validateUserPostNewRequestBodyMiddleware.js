import validateCreateNewUserData from '../helpers/validateCreateNewUserData';

const validateUserPostNewRequestBodyMiddleware = async (req, res, next) => {
  const validation = await validateCreateNewUserData(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.err });
  }
  return next();
};

export default validateUserPostNewRequestBodyMiddleware;
