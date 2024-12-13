import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || 27017;
    this.database = process.env.DB_DATABASE || 'files_manager';
    this.client = null;

    this.connect().catch((err) => {
      console.error(err);
    });
  }

  // Initialize MongoDB connection
  async connect() {
    try {
      const uri = `mongodb://${this.host}:${this.port}/${this.database}`;
      this.client = new MongoClient(uri, {
        useUnifiedTopology: true,
        useNewUrlParser: true
      });

      await this.client.connect();
    } catch (error) {
      throw new Error(`Failed to connect to MongoDB: ${error}`);
    }
  }

  isAlive() {
    return this.client && this.client.isConnected();
  }

  async nbUsers() {
    if (!this.client) return 0;

    const usersCollection = this.client.db().collection('users');
    return usersCollection.countDocuments();
  }

  async nbFiles() {
    if (!this.client) return 0;

    const filesCollection = this.client.db().collection('files');
    return filesCollection.countDocuments();
  }
}

const dbClient = new DBClient();
export default dbClient;
