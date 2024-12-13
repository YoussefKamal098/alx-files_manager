import { MongoClient } from 'mongodb';

/**
 * Class representing a MongoDB client.
 * This class handles the connection to the MongoDB database and provides methods
 * for checking the connection status and counting documents in the users and files collections.
 */
class DBClient {
  /**
   * Creates an instance of the DBClient and establishes a connection to MongoDB.
   * The connection settings (host, port, and database) can be configured via environment variables.
   *
   * @throws {Error} If the connection to MongoDB fails.
   */
  constructor() {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || 27017;
    this.database = process.env.DB_DATABASE || 'files_manager';
    this.client = null;
    this.db = null;

    this.connect().catch((err) => {
      console.error(err);
    });
  }

  /**
   * Initializes the connection to MongoDB.
   * It constructs the MongoDB URI using the provided host and port,
   * and then connects to the MongoDB instance.
   *
   * @async
   * @throws {Error} If the connection to MongoDB fails.
   */
  async connect() {
    try {
      const uri = `mongodb://${this.host}:${this.port}/`;
      this.client = new MongoClient(uri, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
      });

      await this.client.connect();
      this.db = this.client.db(this.database);
    } catch (error) {
      throw new Error(`Failed to connect to MongoDB: ${error}`);
    }
  }

  /**
   * Checks if the connection to MongoDB is alive.
   *
   * @returns {boolean} `true` if the connection is alive, otherwise `false`.
   */
  isAlive() {
    return this.client && this.client.isConnected();
  }

  /**
   * Returns the number of users in the "users" collection.
   *
   * @async
   * @returns {Promise<number>} The number of users in the "users" collection.
   */
  async nbUsers() {
    if (!this.db) return 0;

    return (await this.usersCollection()).countDocuments();
  }

  /**
   * Returns the number of files in the "files" collection.
   *
   * @async
   * @returns {Promise<number>} The number of files in the "files" collection.
   */
  async nbFiles() {
    if (!this.db) return 0;

    return (await this.filesCollection()).countDocuments();
  }

  /**
   * Retrieves a reference to the `users` collection.
   * @returns {Promise<Collection>}
   */
  async usersCollection() {
    return this.client.db().collection('users');
  }

  /**
   * Retrieves a reference to the `files` collection.
   * @returns {Promise<Collection>}
   */
  async filesCollection() {
    return this.client.db().collection('files');
  }
}

// Create and export an instance of DBClient
const dbClient = new DBClient();
export default dbClient;
