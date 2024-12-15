import validateUserPostNewRequestBody from '../helpers/validateUserPostNewRequestBody';

const validateUserPostNewRequestBodyMiddleware = async (req, res, next) => {
  const validation = await validateUserPostNewRequestBody(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.err });
  }
  return next();
};

export default validateUserPostNewRequestBodyMiddleware;
