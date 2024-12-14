import { ObjectId } from 'mongodb';
// import mime from 'mime-types';
import { FILE_TYPES, isValidFileType } from './fileTypes';
import dbClient from './db';

// Constants
const ROOT_FOLDER_ID = '0'; // Default root folder ID, can be set to UUID format if needed
const MAX_NAME_LENGTH = 255; // Maximum length for file/folder names
const INVALID_CHARACTERS = /[<>:"/\\|?*]/; // Invalid characters for filenames
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB in bytes
const BASE64_REGEX = /^(?:[A-Z0-9+/]{4})*(?:[A-Z0-9+/]{2}==|[A-Z0-9+/]{3}=)?$/i;

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

/**
 * Validation result structure.
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Indicates if the validation was successful.
 * @property {string} [error] - Error message if the validation fails.
 */

/**
 * Validates if a name is a valid file or directory name.
 * Ensures the name does not contain invalid characters and is within length limits.
 *
 * @param {string} name - The name of the file or folder.
 * @returns {ValidationResult} The validation result.
 */
const validateName = (name) => {
  if (!name) {
    return { valid: false, error: 'Name cannot be empty' };
  }

  if (INVALID_CHARACTERS.test(name)) {
    return { valid: false, error: 'Name contains invalid characters' };
  }

  if (name.length > MAX_NAME_LENGTH) {
    return { valid: false, error: `Name exceeds maximum length of ${MAX_NAME_LENGTH} characters` };
  }

  return { valid: true };
};

/**
 * Validates if the provided data is a valid Base64-encoded string.
 *
 * @param {string} data - The Base64-encoded string to validate.
 * @returns {ValidationResult} The validation result.
 */
const validateBase64 = (data) => {
  if (!data) {
    return { valid: false, error: 'Data cannot be empty' };
  }

  if (!BASE64_REGEX.test(data)) {
    return { valid: false, error: 'Invalid Base64 string' };
  }

  if (Buffer.byteLength(data, 'base64') > MAX_FILE_SIZE) {
    return { valid: false, error: `Data exceeds maximum file size of ${formatBytes(MAX_FILE_SIZE)}` };
  }

  return { valid: true };
};

/**
 * Validates the parent folder specified by the parentId.
 *
 * @param {string} parentId - The ID of the parent folder.
 *
 * @returns {Promise<ValidationResult>} The validation result.
 */
const validateParent = async (parentId) => {
  const result = {
    valid: false,
    error: null,
  };

  // Check if the parentId is the root folder ID
  if (parentId === ROOT_FOLDER_ID) {
    return { valid: true };
  }

  try {
    ObjectId(parentId);
  } catch (error) {
    return { ...result, error: 'Parent not found' };
  }

  const filesCollection = await dbClient.filesCollection();
  const parentFile = await filesCollection.findOne({ _id: ObjectId(parentId) });

  if (!parentFile) {
    return { ...result, error: 'Parent not found' };
  }

  if (parentFile.type !== FILE_TYPES.FOLDER) {
    return { ...result, error: 'Parent is not a folder' };
  }

  return { valid: true };
};

/**
 * Validates the request data for creating a file or folder.
 *
 * @param {Object} params - The parameters to validate.
 * @param {string} params.name - The name of the file or folder.
 * @param {string} params.type - The type of the file (folder, file, or image).
 * @param {string} [params.data] - The Base64-encoded content of the file (required for file/image).
 * @param {string} [params.parentId=ROOT_FOLDER_ID] -
 *  The ID of the parent folder (default to ROOT_FOLDER_ID).
 * @param {boolean} [isPublic=false] - THe visibility of file (default to false).
 * @returns {Promise<ValidationResult>} The validation result.
 */
const validateFileRequest = async ({
  name, type, data, parentId = ROOT_FOLDER_ID, isPublic = false,
}) => {
  if (name === undefined) {
    return { valid: false, error: 'Missing name' };
  }
  if (type === undefined) {
    return { valid: false, error: 'Missing type' };
  }
  if (!isValidFileType(type)) {
    return { valid: false, error: 'Invalid file type' };
  }
  if (typeof isPublic !== 'boolean') {
    return { valid: false, error: 'isPublic attribute must be a boolean value' };
  }
  if (type !== FILE_TYPES.FOLDER && data === undefined) {
    return { valid: false, error: 'Missing data' };
  }

  const result = {
    valid: false,
    error: null,
  };

  // Validate the name of the file/folder
  const nameValidation = validateName(name);
  if (!nameValidation.valid) {
    return { ...result, error: nameValidation.error };
  }

  // Additional validation for folder name (should not contain a dot)
  if (type === FILE_TYPES.FOLDER && name.includes('.')) {
    return { ...result, error: 'Folder name should not contain a dot' };
  }

  // Additional validation for file extension using mime library
  if (type !== FILE_TYPES.FOLDER) {
    // check if the file extension id valid
    // const mimeType = mime.lookup(name);
    // if (!mimeType) {
    //   return { ...result, error: 'Invalid file extension' };
    // }

    const base64Validation = validateBase64(data);
    if (!base64Validation.valid) {
      return { ...result, error: base64Validation.error };
    }
  }

  // Validate the parent folder
  const parentValidation = await validateParent(parentId);
  if (!parentValidation.valid) {
    return { ...result, error: parentValidation.error };
  }

  return { valid: true };
};

export { ROOT_FOLDER_ID, validateFileRequest };
