import validateUnexpectedAttributes from '../utils/validation';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PASSWORD_REGEX = /^(?=.*\d|.*[@$!%*?&]|.*[A-Z])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * Validates the request data for creating a new user.
 *
 * @param {Record<string, any>} body - The request body to validate.
 * @param {string} body.email - The email of the user.
 * @param {string} body.password - The password for the user.
 * @returns {Promise<ValidationResult>} The validation result.
 */
const validateUserPostNewRequestBody = async (body) => {
  // Validate unexpected attributes
  const allowedAttributes = ['email', 'password'];
  const unexpectedAttributesValidation = validateUnexpectedAttributes(body, allowedAttributes);
  if (!unexpectedAttributesValidation.valid) return unexpectedAttributesValidation;

  const { email, password } = body;

  // Check if required fields are present
  if (!email) return { valid: false, err: 'Missing email' };
  if (!password) return { valid: false, err: 'Missing password' };

  // Ensure both fields are strings
  if (typeof email !== 'string') return { valid: false, err: 'Email must be a string' };
  if (typeof password !== 'string') return { valid: false, err: 'Password must be a string' };

  // Validate email format
  if (!EMAIL_REGEX.test(email)) return { valid: false, err: 'Invalid email format' };
  // Validate password strength
  if (!PASSWORD_REGEX.test(password)) return { valid: false, err: 'Password must be at least 8 characters long, include an uppercase letter, a number, and a special character.' };

  // If all validations pass
  return { valid: true };
};

export default validateUserPostNewRequestBody;
