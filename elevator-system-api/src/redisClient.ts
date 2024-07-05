import { createClient } from 'redis';
import { config } from './config';

const redisClient = createClient({
  url: config.redis.url,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

redisClient.connect();

export default redisClient;
