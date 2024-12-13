import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const mkdirAsync = promisify(fs.mkdir);
const writeFileAsync = promisify(fs.writeFile);

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

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

export { FOLDER_PATH, saveFile };
