import express from 'express';
import { config } from './config';
import { setupRoutes } from './routes';
import { setupRabbitMQ } from './rabbitmqClient';

const app = express();
app.use(express.json());

setupRoutes(app);

setupRabbitMQ(config.rabbitmq.url, config.rabbitmq.queue);

app.listen(config.apiPort, () => {
  console.log(`API server running on http://localhost:${config.apiPort}`);
});
