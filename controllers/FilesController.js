import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import { FILE_TYPES } from '../utils/fileTypes';
import { ROOT_FOLDER_ID, validateFileRequest, validateParent } from '../utils/fileValidation';
import { saveFile } from '../utils/fileStorage';

/**
 * Controller for handling file operations.
 */
class FilesController {
  /**
     * Handles the creation of files and folders.
     *
     * @param {express.Request} req - Express request object
     * @param {express.Response} res - Express response object
     * @returns {Promise<express.Response>} Express response object
     */
  static async postUpload(req, res) {
    const { userId } = req;
    const {
      name, type, parentId = ROOT_FOLDER_ID, isPublic = false, data,
    } = req.body;

    // Validate request parameters
    const validation = validateFileRequest({ name, type, data });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Validate parent folder if parentId is provided
    const parentValidation = await validateParent(parentId);
    if (!parentValidation.valid) {
      return res.status(400).json({ error: parentValidation.error });
    }

    const filesCollection = await dbClient.filesCollection();
    const fileData = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId === ROOT_FOLDER_ID ? ROOT_FOLDER_ID : ObjectId(parentId),
    };

    if (type === FILE_TYPES.FOLDER) {
      const result = await filesCollection.insertOne(fileData);
      return res.status(201).json({ id: result.insertedId, ...fileData, userId });
    }

    // Handle file or image
    try {
      const uuid = uuidv4();

      fileData.localPath = await saveFile(data, uuid);
      const result = await filesCollection.insertOne(fileData);

      return res.status(201).json({ id: result.insertedId, ...fileData, userId });
    } catch (err) {
      return res.status(500).json({ error: 'Error saving the file' });
    }
  }
}

export default FilesController;
