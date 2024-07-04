export const RABBITMQ_URL = 'amqp://localhost:5672';
export const ELEVATOR_QUEUE = 'elevator_events';
export const WEBSOCKET_PORT = 8081;

export const redis = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
};
