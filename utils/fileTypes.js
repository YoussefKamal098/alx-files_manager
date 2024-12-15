/**
 * Constants for file types.
 */
const FILE_TYPES = Object.freeze({
  FOLDER: 'folder',
  FILE: 'file',
  IMAGE: 'image',
});

/**
 * Validates if the given type is a valid file type.
 *
 * @param {string} type - The file type to validate.
 * @returns {boolean} True if the type is valid, false otherwise.
 */
const isValidFileType = (type) => Object.values(FILE_TYPES).includes(type);

export { FILE_TYPES, isValidFileType };
