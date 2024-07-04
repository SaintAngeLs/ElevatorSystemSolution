import amqp from 'amqplib';
import { ElevatorService } from 'elevator-system-class-library';

import { GetElevatorStatusHandler } from './queryHandlers/GetElevatorStatusHandler';
import { GetAllElevatorsHandler } from './queryHandlers/GetAllElevatorsHandler';

import { GetElevatorStatusQuery } from './queries/GetElevatorStatusQuery';
import { GetAllElevatorsQuery } from './queries/GetAllElevatorsQuery';
import { RedisElevatorRepository } from './repositories/redisElevatorRepository';
import { CreateElevatorHandler } from './commandHandlers/createElevatorHandler';
import { UpdateElevatorHandler } from './commandHandlers/updateElevatorHandler';
import { CreateElevatorCommand } from './commands/createElevatorCommand';
import { UpdateElevatorCommand } from './commands/updateElevatorCommand';


export async function setupRabbitMQ(url: string, queue: string) {
  const connection = await amqp.connect(url);
  const channel = await connection.createChannel();
  await channel.assertQueue(queue, { durable: true });

  const repository = new RedisElevatorRepository();
  const elevatorService = new ElevatorService(repository);
  const createElevatorHandler = new CreateElevatorHandler(elevatorService);
  const updateElevatorHandler = new UpdateElevatorHandler(elevatorService);
  const getElevatorStatusHandler = new GetElevatorStatusHandler(elevatorService);
  const getAllElevatorsHandler = new GetAllElevatorsHandler(elevatorService);

  console.log(`Waiting for messages in ${queue} queue...`);
  channel.consume(queue, async (msg: amqp.Message | null) => {
    if (msg !== null) {
      const event = JSON.parse(msg.content.toString());
      console.log('Received event:', event);
      if (event && event.type) {
        await handleEvent(event, createElevatorHandler, updateElevatorHandler, getElevatorStatusHandler, getAllElevatorsHandler, channel, msg);
      } else {
        console.log('Unknown event type:', event.type);
      }
      channel.ack(msg);
    }
  });
}

async function handleEvent(event: any, createHandler: CreateElevatorHandler, updateHandler: UpdateElevatorHandler, statusHandler: GetElevatorStatusHandler, allStatusHandler: GetAllElevatorsHandler, channel: amqp.Channel, msg: amqp.Message) {
  switch (event.type) {
    case 'ELEVATOR_CREATED':
      const createCommand = new CreateElevatorCommand(event.payload.id, event.payload.initialFloor, event.payload.capacity);
      await createHandler.handle(createCommand);
      break;
    case 'ELEVATOR_UPDATED':
      const updateCommand = new UpdateElevatorCommand(event.payload.id, event.payload.currentFloor, event.payload.targetFloor, event.payload.load);
      await updateHandler.handle(updateCommand);
      break;
    case 'GET_ELEVATOR_STATUS':
      const statusQuery = new GetElevatorStatusQuery(event.payload.id);
      const status = await statusHandler.handle(statusQuery);
      channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify(status)), {
        correlationId: msg.properties.correlationId
      });
      break;
    case 'GET_ALL_ELEVATORS_STATUS':
      const allStatusQuery = new GetAllElevatorsQuery();
      const allStatus = await allStatusHandler.handle(allStatusQuery);
      channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify(allStatus)), {
        correlationId: msg.properties.correlationId
      });
      break;
    default:
      console.log('Unknown event type:', event.type);
  }
}
