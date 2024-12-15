/**
 * Converts bytes to a human-readable file size (KB, MB, GB, etc.)
 *
 * @param {number} bytes - The size in bytes.
 * @returns {string} - The human-readable file size.
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  // Determine the index of the size unit (KB, MB, etc.)
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`; // Format and return the size
};

export default formatBytes;
