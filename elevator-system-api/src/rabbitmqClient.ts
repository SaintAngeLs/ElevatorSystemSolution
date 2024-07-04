import amqp from 'amqplib';
import { ElevatorService, InMemoryElevatorRepository } from 'elevator-system-class-library';
import { CreateElevatorHandler } from './commandHandlers/CreateElevatorHandler';
import { UpdateElevatorHandler } from './commandHandlers/updateElevatorHandler';
import { CreateElevatorCommand } from './commands/createElevatorCommand';
import { UpdateElevatorCommand } from './commands/updateElevatorCommand';


export async function setupRabbitMQ(url: string, queue: string) {
    const connection = await amqp.connect(url);
    const channel = await connection.createChannel();
    await channel.assertQueue(queue, { durable: true });

    const repository = new InMemoryElevatorRepository();  
    const elevatorService = new ElevatorService(repository);
    const createElevatorHandler = new CreateElevatorHandler(elevatorService);
    const updateElevatorHandler = new UpdateElevatorHandler(elevatorService);

    console.log(`Waiting for messages in ${queue} queue...`);
    channel.consume(queue, async (msg: amqp.Message | null) => {
        if (msg !== null) {
            const event = JSON.parse(msg.content.toString());
            handleEvent(event, createElevatorHandler, updateElevatorHandler);
            channel.ack(msg);
        }
    });
}

function handleEvent(event: any, createHandler: CreateElevatorHandler, updateHandler: UpdateElevatorHandler) {
    switch (event.type) {
        case 'ELEVATOR_CREATED':
            const createCommand = new CreateElevatorCommand(event.payload.id, event.payload.initialFloor, event.payload.capacity);
            createHandler.handle(createCommand);
            break;
        case 'ELEVATOR_UPDATED':
            const updateCommand = new UpdateElevatorCommand(event.payload.id, event.payload.currentFloor, event.payload.targetFloor, event.payload.load);
            updateHandler.handle(updateCommand);
            break;
        default:
            console.log('Unknown event type:', event.type);
    }
}
