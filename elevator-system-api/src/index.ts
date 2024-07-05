import express from 'express';
import cors from 'cors';
import { config } from './config';
import { setupRoutes } from './routes';
import logger from './logger';
// import { setupRabbitMQ } from './rabbitmqClient';

const app = express();
app.use(express.json());

app.use(cors({
  origin: 'http://localhost:3001' 
}));

setupRoutes(app);

app.listen(config.apiPort, () => {
  logger.info(`API server running on http://localhost:${config.apiPort}`);
});
