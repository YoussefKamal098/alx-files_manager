# File Manager API

## Overview
This project is a backend service for file management, designed to allow users to upload and manage files and directories. The key features include user authentication, file upload, file permission management, image thumbnail generation, and background processing. It utilizes Node.js, MongoDB, Redis, and background processing with Bull.

## Features
- **User Authentication**: Users can authenticate via token-based authentication.
- **File Management**: Users can upload files, create folders, change file permissions, and view files.
- **Image Thumbnail Generation**: Automatically generate thumbnails for image files.
- **Background Processing**: Uses Bull for handling background tasks like image processing.
- **File Listing**: Users can retrieve a list of files, get specific file details, and access file content.
- **File Publishing/Unpublishing**: Users can change the visibility of their files by setting them as public or private.

## Tech Stack
- **Node.js**: Backend framework.
- **Express**: Web framework to handle routing.
- **MongoDB**: Database for storing user and file data.
- **Redis**: Caching and temporary data storage.
- **Bull**: Task queue for background processing.
- **MIME Types**: For handling different file types.

## Resources
- [Node.js Getting Started](https://nodejs.org/en/docs/guides/getting-started-guide/)
- [Express Getting Started](https://expressjs.com/en/starter/installing.html)
- [MongoDB Documentation](https://www.mongodb.com/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [Bull Documentation](https://docs.bullmq.io/)
- [Mocha Testing Framework](https://mochajs.org/)
- [Mime-Types Documentation](https://www.npmjs.com/package/mime-types)

## Requirements
- **Editors**: vi, vim, emacs, Visual Studio Code
- **Environment**: Ubuntu 18.04 LTS, Node.js (version 12.x.x)
- **Dependencies**: Use `npm install` to install required packages.
- **Coding Style**: Code must be linted using ESLint.
- **File Extensions**: JavaScript (.js)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YoussefKamal098/alx-files_manager.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set environment variables:
    - `DB_HOST`: MongoDB host (default: localhost)
    - `DB_PORT`: MongoDB port (default: 27017)
    - `DB_DATABASE`: MongoDB database (default: files_manager)
    - `PORT`: Server port (default: 5000)
    - `FOLDER_PATH`: Directory to store files (default: /tmp/files_manager)

4. Start the server:
   ```bash
   npm run start-server
   ```

## API Endpoints

### Authentication
- **POST /connect**: Authenticate a user by email and password (Base64 encoded) to generate a token.
- **GET /disconnect**: Log out by deleting the authentication token.
- **GET /users/me**: Retrieve the current user’s information using the authentication token.

### File Management
- **GET /status**: Check if Redis and MongoDB are alive.
- **GET /stats**: Get the number of users and files in the database.
- **POST /users**: Create a new user by providing an email and password (password is stored hashed).
- **POST /files**: Upload a file or create a folder. Supports uploading files, images (with Base64 encoding), and folders.

#### Get and List Files
- **GET /files**: Retrieve all files for a user based on a parentId, with pagination (default parentId = 0).
- **GET /files/:id**: Retrieve a file by its ID.

#### File Publish/Unpublish
- **PUT /files/:id/publish**: Set the file as public.
- **PUT /files/:id/unpublish**: Set the file as private.

#### File Data
- **GET /files/:id/data**: Retrieve the content of a file. Supports a query parameter `size` for image thumbnail sizes (500, 250, or 100).

#### Image Thumbnail Generation
- **POST /files**: Start background processing for generating image thumbnails when a new image is uploaded. Thumbnails are created with Bull queue processing.

### Error Handling
- **400 Bad Request**: Missing or invalid parameters.
- **401 Unauthorized**: Invalid or missing authentication token.
- **404 Not Found**: Resource not found.
- **500 Internal Server Error**: Server-side errors.

## Project Structure

```
.
├── controllers/
│   ├── AppController.js        # Handles /status and /stats routes
│   ├── AuthController.js       # Handles authentication routes
│   ├── FilesController.js      # Handles file upload and management
│   └── UsersController.js      # Handles user creation and user data retrieval
├── routes/
│   └── index.js                # Defines API routes
├── utils/
│   ├── db.js                   # MongoDB client and helpers
│   ├── redis.js                # Redis client and helpers
│   └── worker.js               # Handles background processing for image thumbnails
├── .eslintrc.js                # ESLint configuration
├── babel.config.js             # Babel configuration
├── package.json                # Project dependencies and scripts
└── README.md                   # Project documentation
```

## Example Usage

### Create a New User
```bash
curl -XPOST 0.0.0.0:5000/users -H "Content-Type: application/json" -d '{"email": "bob@dylan.com", "password": "toto1234!"}'
```

### Authenticate a User
```bash
curl 0.0.0.0:5000/connect -H "Authorization: Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE="
```

### Upload a File
```bash
curl -XPOST 0.0.0.0:5000/files -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" -H "Content-Type: application/json" -d '{"name": "myText.txt", "type": "file", "data": "SGVsbG8gV2Vic3RhY2shCg=="}'
```

### View Status
```bash
curl 0.0.0.0:5000/status
```

### View Stats
```bash
curl 0.0.0.0:5000/stats
```

### Get File List
```bash
curl 0.0.0.0:5000/files -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f"
```

### Get Specific File by ID
```bash
curl 0.0.0.0:5000/files/5f1e879ec7ba06511e683b22 -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f"
```

### Publish a File
```bash
curl -XPUT 0.0.0.0:5000/files/5f1e879ec7ba06511e683b22/publish -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f"
```

### Unpublish a File
```bash
curl -XPUT 0.0.0.0:5000/files/5f1e879ec7ba06511e683b22/unpublish -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f"
```

### Retrieve File Data
```bash
curl -XGET 0.0.0.0:5000/files/5f1e879ec7ba06511e683b22/data -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f"
```

### Retrieve Image Thumbnail by Size
```bash
curl -XGET 0.0.0.0:5000/files/5f1e879ec7ba06511e683b22/data?size=500 -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f"
```

## Learning Objectives

By the end of this project, you should be able to:

- Create a RESTful API with Express.
- Implement user authentication and store session tokens.
- Integrate MongoDB to store persistent data.
- Use Redis for temporary data storage and caching.
- Work with Bull for background job processing.
- Implement file management, including listing, retrieving, and modifying file data.
- Handle image processing asynchronously using Bull.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
