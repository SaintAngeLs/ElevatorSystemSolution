export const config = {
    rabbitmq: {
        url: 'amqp://localhost:5672',
        queue: 'elevator_events'
    },
    apiPort: 8080,
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
};
