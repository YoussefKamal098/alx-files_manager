import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || 27017;
    this.database = process.env.DB_DATABASE || 'files_manager';
    this.client = null;
    this.db = null;
  }

  // Initialize MongoDB connection
  async connect() {
    try {
      const uri = `mongodb://${this.host}:${this.port}`;
      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db(this.database);
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      throw new Error('Failed to connect to MongoDB');
    }
  }

  isAlive() {
    return this.client && this.client.isConnected();
  }

  async nbUsers() {
    const usersCollection = this.db.collection('users');
    return await usersCollection.countDocuments();
  }

  async nbFiles() {
    const filesCollection = this.db.collection('files');
    return await filesCollection.countDocuments();
  }
}


const dbClient = new DBClient();
export default dbClient;
