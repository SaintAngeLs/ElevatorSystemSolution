import express from 'express';
import cors from 'cors';
import { config } from './config';
import { setupRoutes } from './routes';
// import { setupRabbitMQ } from './rabbitmqClient';

const app = express();
app.use(express.json());

app.use(cors({
  origin: 'http://localhost:3001' 
}));

setupRoutes(app);
// setupRabbitMQ(config.rabbitmq.url, config.rabbitmq.queue);

app.listen(config.apiPort, () => {
  console.log(`API server running on http://localhost:${config.apiPort}`);
});
