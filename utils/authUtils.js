/**
 * Decoded credentials structure.
 * @typedef {Object} DecodedCredentials
 * @property {string} decodedEmail - The email extracted from the authorization header.
 * @property {string} decodedPassword - The password extracted from the authorization header.
 */

/**
 * Decodes the Base64-encoded authorization header and returns the email and password.
 *
 * @param {string} authHeader - The Authorization header value.
 * @returns {DecodedCredentials} An object containing the email and password.
 * @throws {Error} If the authorization header is invalid or missing.
 */
export default function decodeBasicAuthHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    throw new Error('Invalid Authorization header');
  }

  const base64Credentials = authHeader.split(' ')[1]; // Extract credentials after 'Basic '
  const decodedCredentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const sepPos = decodedCredentials.indexOf(':');

  if (sepPos === -1) {
    throw new Error('Invalid credentials format');
  }

  const email = decodedCredentials.substring(0, sepPos);
  const password = decodedCredentials.substring(sepPos + 1);

  return { decodedEmail: email, decodedPassword: password };
}
