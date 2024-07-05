export const config = {
  rabbitmq: {
    url: 'amqp://localhost:5672',
    queue: 'elevator_events',
  },
  webSocketPort: 8081,
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
};
