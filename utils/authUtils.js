/**
 * Decodes the Base64-encoded authorization header and returns the email and password.
 *
 * @param {string} authHeader - The Authorization header value.
 * @returns {Object} - An object containing the email and password.
 */
export function decodeAuthHeader(authHeader) {
  const base64Credentials = authHeader.split(' ')[1]; // Extract credentials after 'Basic '
  const decodedCredentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const sepPos = decodedCredentials.indexOf(':');

  const email = decodedCredentials.substring(0, sepPos);
  const password = decodedCredentials.substring(sepPos + 1);

  return { email, password };
}
