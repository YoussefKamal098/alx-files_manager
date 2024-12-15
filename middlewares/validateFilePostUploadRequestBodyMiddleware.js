import validateFilePostUploadRequestBody from '../helpers/validateFilePostUploadRequestBody';

/**
 * Middleware to authenticate user based on token stored in Redis.
 */
const validateFilePostUploadRequestBodyMiddleware = async (req, res, next) => {
  const validation = await validateFilePostUploadRequestBody(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.err });
  }
  return next();
};

export default validateFilePostUploadRequestBodyMiddleware;
