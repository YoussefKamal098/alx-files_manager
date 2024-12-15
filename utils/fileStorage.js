import fs, { promises as fsPromises } from 'fs';
import path from 'path';
import { promisify } from 'util';

import { FOLDER_PATH } from '../config';

const mkdirAsync = promisify(fs.mkdir);
const writeFileAsync = promisify(fs.writeFile);

/**
 * Ensures the existence of the storage folder.
 *
 * @returns {Promise<void>} Resolves when the folder is created or already exists.
 */
const ensureStorageFolder = async () => {
  await mkdirAsync(FOLDER_PATH, { recursive: true });
};

/**
 * Saves a file to the storage folder.
 *
 * @param {string} data - Base64-encoded content of the file.
 * @param {string} filename - The unique filename for saving.
 *
 * @returns {Promise<string>} The absolute path of the saved file.
 */
const saveFile = async (data, filename) => {
  await ensureStorageFolder();
  const filePath = path.join(FOLDER_PATH, filename);
  const fileContent = Buffer.from(data, 'base64');
  await writeFileAsync(filePath, fileContent);
  return filePath;
};

/**
 * Retrieves a file as a stream from the storage folder if it exists.
 *
 * @param {string} filepath - The path of the file to retrieve.
 *
 * @returns {Promise<fs.ReadStream|null>} The file stream if valid,
 * or null if the file does not exist.
 */
const streamFile = async (filepath) => {
  try {
    // Check if the file exists asynchronously
    await fsPromises.access(filepath);

    // Return a readable stream of the file content
    return fs.createReadStream(filepath);
  } catch (error) {
    return null; // File not found or other error
  }
};

export { saveFile, streamFile };
