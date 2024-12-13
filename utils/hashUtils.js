import crypto from 'crypto';

/**
 * Hashes a password using SHA-1.
 *
 * @param {string} password - The password to hash.
 * @returns {string} - The hashed password.
 */
export function hashPassword(password) {
  return crypto.createHash('sha1').update(password).digest('hex');
}

/**
 * Verifies a password against a hashed password.
 *
 * @param {string} password - The plain password to verify.
 * @param {string} hashedPassword - The hashed password to compare against.
 * @returns {boolean} - Returns true if the passwords match, false otherwise.
 */
export function verifyPassword(password, hashedPassword) {
  const hashedInput = hashPassword(password);
  return hashedInput === hashedPassword;
}
