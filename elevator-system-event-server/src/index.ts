import { RedisElevatorRepository } from './repositories/redisElevatorRepository';
import { ElevatorService } from 'elevator-system-class-library';
import { ElevatorWebSocketServer } from './webSocketServer';
import { RabbitMQConsumer } from './consumer';

const repository = new RedisElevatorRepository();
const elevatorService = new ElevatorService(repository);
const webSocketServer = new ElevatorWebSocketServer(elevatorService);
const consumer = new RabbitMQConsumer(webSocketServer);

webSocketServer.start();
consumer.start().catch(console.error);
