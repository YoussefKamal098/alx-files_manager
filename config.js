// File type constants
const FILE_TYPES = Object.freeze({
    FOLDER: 'folder',
    FILE: 'file',
    IMAGE: 'image',
});

// Database connection constants
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 27017;
const DB_DATABASE = process.env.DB_DATABASE || 'files_manager';

// Server configuration
const PORT = process.env.PORT || 5000;

// File storage constants
const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager'; // Default file storage path
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB in bytes

// Root folder ID (default value can be changed to UUID if needed)
const ROOT_FOLDER_ID = '0';

// Helper function to validate file types
const isValidFileType = (type) => Object.values(FILE_TYPES).includes(type);

export { FILE_TYPES, isValidFileType, DB_HOST, DB_PORT, DB_DATABASE, PORT, FOLDER_PATH, MAX_FILE_SIZE, ROOT_FOLDER_ID };
