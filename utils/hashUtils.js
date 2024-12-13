import crypto from 'crypto';

/**
 * Hashes a password using SHA-1.
 *
 * @param {string} password - The password to hash.
 * @returns {string} - The hashed password.
 */
export function hashPasswordSha1(password) {
  return crypto.createHash('sha1').update(password).digest('hex');
}

/**
 * Verifies a password against a hashed password.
 *
 * @param {string} password - The plain password to verify.
 * @param {string} hashedPassword - The hashed password to compare against.
 * @returns {boolean} - Returns true if the passwords match, false otherwise.
 */
export function verifyPasswordSha1(password, hashedPassword) {
  const hashedInput = hashPasswordSha1(password);
  return hashedInput === hashedPassword;
}
