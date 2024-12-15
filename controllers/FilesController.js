import { promises as fsPromises } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';
import { ObjectId } from 'mongodb';

import dbClient from '../utils/db';
import redisClient from '../utils/redis';

import { saveFile, streamFile } from '../utils/fileStorage';
import paginateCollection from '../helpers/paginateCollection';

import { FILE_TYPES, ROOT_FOLDER_ID } from '../config';

/**
 * @typedef {Object} FileData
 * @property {string} name - The name of the file or folder.
 * @property {string} type - The type of the file (either 'file' or 'folder').
 * @property {string} parentId - The ID of the parent folder (optional, defaults to ROOT_FOLDER_ID).
 * @property {string} [localPath] - The local path of the file (optional).
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
    const { userId, body } = req;

    const fileData = {
      userId: ObjectId(userId),
      name: body.name,
      type: body.type,
      isPublic: body.isPublic !== undefined,
      parentId: FilesController.formatParentId(body.parentId),
    };

    if (body.type === FILE_TYPES.FOLDER) return FilesController.createFolder(fileData, res);

    return FilesController.createFile(fileData, body.data, res);
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
      ObjectId(fileId);
    } catch (error) {
      return res.status(404).json({ error: 'Invalid file id' });
    }

    try {
      const filesCollection = await dbClient.filesCollection();
      const file = await filesCollection.findOne({
        _id: new ObjectId(fileId), userId: new ObjectId(userId),
      });

      if (!file) return res.status(404).json({ error: 'Not found' });

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

    const parentId = req.query.parentId || ROOT_FOLDER_ID; // Default to root folder
    const page = parseInt(req.query.page, 10) || 0; // Default to the first page
    const pageSize = 20; // Limit each page to 20 items

    try {
      ObjectId(parentId);
    } catch (error) {
      if (parentId !== ROOT_FOLDER_ID) return res.status(404).json({ error: 'Invalid parent id' });
    }

    try {
      const filesCollection = await dbClient.filesCollection();
      const files = await paginateCollection(
        filesCollection,
        {
          userId: new ObjectId(userId),
          parentId: parentId === ROOT_FOLDER_ID ? ROOT_FOLDER_ID : new ObjectId(parentId),
        },
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
   * Publishes a file by setting `isPublic` to `true`.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @returns {Promise<object>} Express response object.
   */
  static async putPublish(req, res) {
    const { userId } = req;
    const fileId = req.params.id;

    try {
      ObjectId(fileId);
    } catch (error) {
      return res.status(404).json({ error: 'Invalid file id' });
    }

    try {
      const updatedFile = await FilesController.updateFileVisibility(fileId, true, userId);
      if (!updatedFile) return res.status(404).json({ error: 'Not found' });

      return res.status(200).json({
        id: updatedFile._id,
        userId: updatedFile.userId,
        name: updatedFile.name,
        type: updatedFile.type,
        isPublic: updatedFile.isPublic,
        parentId: updatedFile.parentId,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Unpublishes a file by setting `isPublic` to `false`.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @returns {Promise<object>} Express response object.
   */
  static async putUnpublish(req, res) {
    const { userId } = req;
    const fileId = req.params.id;

    try {
      ObjectId(fileId);
    } catch (error) {
      return res.status(404).json({ error: 'Invalid file id' });
    }

    try {
      const updatedFile = await FilesController.updateFileVisibility(fileId, false, userId);
      if (!updatedFile) return res.status(404).json({ error: 'Not found' });

      return res.status(200).json({
        id: updatedFile._id,
        userId: updatedFile.userId,
        name: updatedFile.name,
        type: updatedFile.type,
        isPublic: updatedFile.isPublic,
        parentId: updatedFile.parentId,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Retrieves the content of the file.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @returns {Promise<object>} Express response object.
   */
  static async getFile(req, res) {
    const fileId = req.params.id;
    const userId = await redisClient.get(`auth_${req.headers['x-token']}`);

    try {
      ObjectId(fileId);
    } catch (error) {
      return res.status(404).json({ error: 'Invalid file id' });
    }

    try {
      const filesCollection = await dbClient.filesCollection();
      const file = await filesCollection.findOne({ _id: new ObjectId(fileId) });

      if (!file) return res.status(404).json({ error: 'Not found' });

      // Check if the file is public or if the user is the owner
      if (!file.isPublic && userId !== file.userId.toString()) return res.status(404).json({ error: 'Not found' });

      // Check if the file is a folder
      if (file.type === 'folder') return res.status(400).json({ error: "A folder doesn't have content" });

      // Asynchronously check if the file exists locally
      try {
        await fsPromises.access(file.localPath); // Check if the file exists asynchronously
      } catch (error) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Return the file content with the correct MIME type
      res.setHeader('Content-Type', mime.contentType(file.name) || 'text/plain; charset=utf-8');
      const stream = await streamFile(file.localPath);

      return stream.pipe(res); // Stream the file content to the response
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Helper function to update file visibility.
   * @param {ObjectId} fileId - The ID of the file to update.
   * @param {boolean} isPublic - The visibility status to set.
   * @param {ObjectId} userId - The ID of the user.
   * @returns {Promise<object | null>} The updated file or null if file not found.
   */
  static async updateFileVisibility(fileId, isPublic, userId) {
    const filesCollection = await dbClient.filesCollection();
    const file = await filesCollection.findOne(
      { _id: new ObjectId(fileId), userId: new ObjectId(userId) },
    );

    if (!file) return null;

    await filesCollection.updateOne(
      { _id: new ObjectId(fileId) },
      { $set: { isPublic } },
    );

    // Fetch the updated file from the database
    return filesCollection.findOne({ _id: new ObjectId(fileId) });
  }

  /**
   * Formats the parentId, ensuring ROOT_FOLDER_ID is handled correctly.
   *
   * @param {string | undefined} parentId - Parent folder ID.
   * @returns {string} Formatted parent ID.
   */
  static formatParentId(parentId) {
    const id = !parentId ? ROOT_FOLDER_ID : parentId.toString();
    return id === ROOT_FOLDER_ID ? ROOT_FOLDER_ID : new ObjectId(id);
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
      _id: undefined,
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
        _id: undefined,
        parentId: fileDataCopy.parentId === ROOT_FOLDER_ID ? 0 : fileData.parentId,
      });
    } catch (err) {
      return res.status(500).json({ error: 'Error saving the file' });
    }
  }
}

export default FilesController;
