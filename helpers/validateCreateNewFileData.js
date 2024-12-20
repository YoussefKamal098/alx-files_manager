import { ObjectId } from 'mongodb';

import dbClient from '../utils/db';
import formatBytes from '../utils/formatUtils';
import validateUnexpectedAttributes from '../utils/validation';
import {
  FILE_TYPES, ROOT_FOLDER_ID, MAX_FILE_SIZE, isValidFileType,
} from '../config';

/**
 * Validation result structure.
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Indicates if the validation was successful.
 * @property {string | null} [err] - Error message if the validation fails.
 */

// Constants
const MAX_NAME_FILE_LENGTH = 255; // Maximum length for file/folder names
const INVALID_FILE_NAME_CHARACTERS = /[<>:"/\\|?*]/; // Invalid characters for filenames
const BASE64_REGEX = /^(?:[A-Z0-9+/]{4})*(?:[A-Z0-9+/]{2}==|[A-Z0-9+/]{3}=)?$/i;

/**
 * Validates if a name is a valid file or directory name.
 * Ensures the name does not contain invalid characters and is within length limits.
 *
 * @param {string} name - The name of the file or folder.
 * @returns {ValidationResult} The validation result.
 */
const validateFileName = (name) => {
  if (!name) {
    return { valid: false, err: 'Name cannot be empty' };
  }

  if (INVALID_FILE_NAME_CHARACTERS.test(name)) {
    return { valid: false, err: 'Name contains invalid characters' };
  }

  if (name.length > MAX_NAME_FILE_LENGTH) {
    return { valid: false, err: `Name exceeds maximum length of ${MAX_NAME_FILE_LENGTH} characters` };
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
    return { valid: false, err: 'Data cannot be empty' };
  }

  if (!BASE64_REGEX.test(data)) {
    return { valid: false, err: 'Invalid Base64 string' };
  }

  if (Buffer.byteLength(data, 'base64') > MAX_FILE_SIZE) {
    return { valid: false, err: `Data exceeds maximum file size of ${formatBytes(MAX_FILE_SIZE)}` };
  }

  return { valid: true };
};

/**
 * Validates the parent folder specified by the parentId.
 *
 * @param {string | undefined} parentId - The ID of the parent folder.
 *
 * @returns {Promise<ValidationResult>} The validation result.
 */
const validateParentId = async (parentId) => {
  // Check if the parentId is defined the root folder ID
  if (!parentId) return { valid: false, err: 'Invalid parent id' };
  if (parentId.toString() === ROOT_FOLDER_ID) return { valid: true };

  try {
    ObjectId(parentId);
  } catch (error) {
    return { valid: false, err: 'Parent not found' };
  }

  const filesCollection = await dbClient.filesCollection();
  const parentFile = await filesCollection.findOne({ _id: ObjectId(parentId) });

  if (!parentFile) {
    return { valid: false, err: 'Parent not found' };
  }

  if (parentFile.type !== FILE_TYPES.FOLDER) {
    return { valid: false, err: 'Parent is not a folder' };
  }

  return { valid: true };
};

/**
 * Validates the object for creating a file or folder.
 *
 * @param {Record<string, any>} object - The object to validate
 * @param {string} object.name - The name of the file or folder.
 * @param {string} object.type - The type of the file (folder, file, or image).
 * @param {string} [object.data] - The Base64-encoded content of the file (required for file/image).
 * @param {string} [object.parentId=ROOT_FOLDER_ID] -
 *  The ID of the parent folder (default to ROOT_FOLDER_ID).
 * @param {boolean} [object.isPublic=false] - The visibility of the file (default to false).
 * @returns {Promise<ValidationResult>} The validation result.
 */
const validateCreateNewFileData = async (object) => {
  const allowedAttributes = ['name', 'type', 'data', 'parentId', 'isPublic'];
  const unexpectedAttributesValidation = validateUnexpectedAttributes(object, allowedAttributes);
  if (!unexpectedAttributesValidation.valid) return unexpectedAttributesValidation;

  const {
    name,
    type,
    data,
    parentId = ROOT_FOLDER_ID,
    isPublic = false,
  } = object;

  // Validate required fields
  if (!name) return { valid: false, err: 'Missing name' };
  if (!type) return { valid: false, err: 'Missing type' };
  if (typeof name !== 'string') return { valid: false, err: 'name attr must be a string value' };
  if (typeof type !== 'string') return { valid: false, err: 'type attr must be a string value' };
  if (!isValidFileType(type)) return { valid: false, err: 'Invalid file type' };
  if (type !== FILE_TYPES.FOLDER && !data) return { valid: false, err: 'Missing data' };
  if (typeof isPublic !== 'boolean') return { valid: false, err: 'isPublic attr must be a boolean value' };

  // Validate the name
  const nameValidation = validateFileName(name);
  if (!nameValidation.valid) return { valid: false, err: nameValidation.err };

  // Additional folder-specific validation
  if (type === FILE_TYPES.FOLDER && name.includes('.')) {
    return { valid: false, err: 'Folder name should not contain a dot' };
  }

  // Additional file-specific validation
  if (type !== FILE_TYPES.FOLDER) {
    const base64Validation = validateBase64(data);
    if (!base64Validation.valid) return { valid: false, err: base64Validation.err };
  }

  // Validate the parent folder
  const parentValidation = await validateParentId(parentId);
  if (!parentValidation.valid) return { valid: false, err: parentValidation.err };

  // If all validations pass
  return { valid: true };
};

export { ROOT_FOLDER_ID };
export default validateCreateNewFileData;
