import { ObjectId } from 'mongodb';
import { FILE_TYPES, isValidFileType } from './fileTypes';
import dbClient from './db';

// Constants
const ROOT_FOLDER_ID = '0'; // Default root folder ID, can be set to UUID format if needed
const MAX_NAME_LENGTH = 255; // Maximum length for file/folder names
const INVALID_CHARACTERS = /[<>:"/\\|?*]/; // Invalid characters for filenames
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB in bytes
const BASE64_REGEX = /^(?:[A-Z0-9+\/]{4})*(?:[A-Z0-9+\/]{2}==|[A-Z0-9+\/]{3}=)?$/i;

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
    return { valid: false, error: 'Data exceeds maximum file size of 2GB' };
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
 *
 * @returns {ValidationResult} The validation result.
 */
const validateFileRequest = ({ name, type, data }) => {
  const result = {
    valid: false,
    error: null,
  };

  // Validate the name of the file/folder
  const nameValidation = validateName(name);
  if (!nameValidation.valid) {
    return { ...result, error: nameValidation.error };
  }

  if (!isValidFileType(type)) {
    return { ...result, error: 'Invalid file type' };
  }

  // Validate the Base64 data if the type is not a folder
  if (type !== FILE_TYPES.FOLDER) {
    const base64Validation = validateBase64(data);
    if (!base64Validation.valid) {
      return { ...result, error: base64Validation.error };
    }
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

export { ROOT_FOLDER_ID, validateFileRequest, validateParent };
