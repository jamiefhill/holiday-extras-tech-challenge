import APIServer from './src/server/server';
import dotenv from 'dotenv';
import MongoConnection from './src/connection/MongoConnection';
import UserRepository from './src/repository/UserRepository';
import UserService from './src/services/UserService';
import { pino, logConfig } from './src/services/logger';

dotenv.config();

const userCollection = process.env.MONGO_USER_COLLECTION;
const username = process.env.MONGO_USERNAME;
const password = process.env.MONGO_PASSWORD;
const host = process.env.MONGO_INTERNAL_URL;
const authDB = process.env.MONGO_AUTH_DB;
const DB = process.env.MONGO_USER_DB;
const secretKey = process.env.SECRET_KEY;
const PORT = process.env.API_PORT;

const mongoConn = new MongoConnection(username, password, host, authDB, DB);
const userRepo = new UserRepository(mongoConn, userCollection);
const userService = new UserService(userRepo, secretKey, pino);

const apiServer = new APIServer(userService, pino, logConfig);

apiServer.startServer(PORT);
