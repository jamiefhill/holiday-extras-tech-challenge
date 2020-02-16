import APIServer from './src/server';
import { PORT } from './src/models/RouteConstants';
import dotenv from 'dotenv';

dotenv.config();

const apiServer = new APIServer();

apiServer.startServer(PORT);