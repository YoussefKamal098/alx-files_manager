import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import { FILE_TYPES } from '../utils/fileTypes';
import { ROOT_FOLDER_ID, validateFileRequest, validateParent } from '../utils/fileValidation';
import { saveFile } from '../utils/fileStorage';
import paginateCollection from '../utils/paginateCollection';

/**
 * @typedef {Object} FileData
 * @property {string} name - The name of the file or folder.
 * @property {string} type - The type of the file (either 'file' or 'folder').
 * @property {string} parentId - The ID of the parent folder (optional, defaults to ROOT_FOLDER_ID).
 * @property {string?} localPath - The local path of the file (optional).
 * @property {string} userId - The ID of the user.
 * @property {boolean} [isPublic=false] - Indicates whether the file is public (defaults to false).
 */

/**
 * Controller for handling file operations.
 */
class FilesController {
  /**
   * Handles the creation of files and folders.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @returns {Promise<object>} Express response object.
   */
  static async postUpload(req, res) {
    const { userId } = req;
    const {
      name, type, parentId = ROOT_FOLDER_ID, isPublic = false, data,
    } = req.body;

    const validation = await FilesController.validateRequest({
      name, type, data, parentId, isPublic, userId,
    });

    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const fileData = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: FilesController.formatParentId(parentId),
    };

    if (type === FILE_TYPES.FOLDER) {
      return FilesController.createFolder(fileData, res);
    }

    return FilesController.createFile(fileData, data, res);
  }

  /**
   * Retrieves a file document by its ID for the authenticated user.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @returns {Promise<object>} Express response object.
   */
  static async getShow(req, res) {
    const { userId } = req;
    const fileId = req.params.id;

    try {
      const filesCollection = await dbClient.filesCollection();
      const file = await filesCollection.findOne({ _id: new ObjectId(fileId), userId });

      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      return res.status(200).json({
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Retrieves all file documents for the authenticated user with pagination.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @returns {Promise<object>} Express response object.
   */
  static async getIndex(req, res) {
    const { userId } = req;

    const parentId = req.query.parentId || '0'; // Default to root folder
    const page = parseInt(req.query.page, 10) || 0; // Default to the first page
    const pageSize = 20; // Limit each page to 20 items

    try {
      const filesCollection = await dbClient.filesCollection();
      const files = await paginateCollection(
        filesCollection,
        { userId, parentId },
        page,
        pageSize,
      );

      return res.status(200).json(files.map((file) => ({
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
      })));
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Validates the file request.
   *
   * @param {Object} params - The request parameters.
   * @param {string} params.name - The name of the file/folder.
   * @param {string} params.type - The type of the file (e.g., 'file', 'folder').
   * @param {string} params.data - The base64 file data (if a file).
   * @param {string} params.parentId - The ID of the parent folder (optional).
   * @returns {Promise<ValidationResult>} Validation result.
   */
  static async validateRequest({
    name, type, data, parentId,
  }) {
    const fileValidation = validateFileRequest({ name, type, data });
    if (!fileValidation.valid) return { valid: false, error: fileValidation.error };

    const parentValidation = await validateParent(parentId);
    if (!parentValidation.valid) return { valid: false, error: parentValidation.error };

    return { valid: true };
  }

  /**
   * Formats the parentId, ensuring ROOT_FOLDER_ID is handled correctly.
   *
   * @param {string} parentId - Parent folder ID.
   * @returns {string} Formatted parent ID.
   */
  static formatParentId(parentId) {
    return parentId === ROOT_FOLDER_ID ? ROOT_FOLDER_ID : ObjectId(parentId);
  }

  /**
   * Creates a folder in the database.
   *
   * @param {FileData} fileData - File data for the folder.
   * @param {object} res - Express response object.
   * @returns {Promise<object>} Express response object.
   */
  static async createFolder(fileData, res) {
    const filesCollection = await dbClient.filesCollection();
    const result = await filesCollection.insertOne(fileData);

    return res.status(201).json({
      id: result.insertedId,
      ...fileData,
      parentId: fileData.parentId === ROOT_FOLDER_ID ? 0 : fileData.parentId,
    });
  }

  /**
   * Creates a file or image in the database and saves it to storage.
   *
   * @param {FileData} fileData - File data for the file/image.
   * @param {string} data - Base64 encoded file data.
   * @param {object} res - Express response object.
   * @returns {Promise<object>} Express response object.
   */
  static async createFile(fileData, data, res) {
    try {
      const fileDataCopy = { ...fileData };

      const uuid = uuidv4();
      fileDataCopy.localPath = await saveFile(data, uuid);

      const filesCollection = await dbClient.filesCollection();
      const result = await filesCollection.insertOne(fileDataCopy);

      return res.status(201).json({
        id: result.insertedId,
        ...fileDataCopy,
        parentId: fileDataCopy.parentId === ROOT_FOLDER_ID ? 0 : fileData.parentId,
      });
    } catch (err) {
      return res.status(500).json({ error: 'Error saving the file' });
    }
  }
}

export default FilesController;
