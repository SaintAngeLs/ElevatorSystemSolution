import amqp from 'amqplib';
import { ElevatorService, ElevatorRequest, Elevator, ElevatorStatus } from 'elevator-system-class-library';
import WebSocket, { WebSocketServer } from 'ws';
import { RABBITMQ_URL, ELEVATOR_QUEUE, WEBSOCKET_PORT } from './config';
import { RedisElevatorRepository } from './repositories/redisElevatorRepository';
import { ElevatorUpdatedEvent } from './events/elevatorUpdatedEvent';

const clients: WebSocket[] = [];
const moveIntervals: { [key: number]: NodeJS.Timeout } = {};

async function startConsumer() {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(ELEVATOR_QUEUE, { durable: true });

    const repository = new RedisElevatorRepository();
    const elevatorService = new ElevatorService(repository);

    console.log(`Waiting for messages in ${ELEVATOR_QUEUE} queue...`);
    channel.consume(ELEVATOR_QUEUE, async (msg) => {
        if (msg !== null) {
            const event = JSON.parse(msg.content.toString());
            if (Object.keys(event).length === 0) {
                console.warn('Received empty message');
            } else {
                try {
                    await handleEvent(event, channel, elevatorService);
                } catch (error) {
                    console.error('Error handling event:', error);
                }
                channel.ack(msg);
            }
        }
    });

    startWebSocketServer(elevatorService);
}

async function handleEvent(event: any, channel: amqp.Channel, elevatorService: ElevatorService) {
    switch (event.type) {
        case 'PICKUP_REQUEST':
            console.log('Handling pickup request:', event.payload);
            await elevatorService.handlePickupRequest(new ElevatorRequest(event.payload.floor, event.payload.direction));
            startContinuousBroadcast(elevatorService, channel);
            break;
        case 'ELEVATOR_UPDATED':
            console.log('Handling update:', event.payload);
            await elevatorService.handleUpdate(event.payload.id, event.payload.currentFloor, event.payload.targetFloor, event.payload.load);
            broadcastUpdate(await elevatorService.getStatus());
            break;
        default:
            console.log('Unknown event type:', event.type);
    }
}

function startContinuousBroadcast(elevatorService: ElevatorService, channel: amqp.Channel) {
    const moveElevator = async (elevator: Elevator) => {
        try {
            while (elevator.currentFloor !== elevator.targetFloor && elevator.targetFloor !== null) {
                elevator.move();
                await elevatorService.updateElevator(elevator);

                // Always publish the event if the elevator is moving
                const event = new ElevatorUpdatedEvent({
                    id: elevator.id,
                    currentFloor: elevator.currentFloor,
                    targetFloor: elevator.targetFloor!,
                    load: elevator.load
                });
                await channel.sendToQueue(ELEVATOR_QUEUE, Buffer.from(JSON.stringify(event)));
                broadcastUpdate(await elevatorService.getStatus());

                // Simulate time delay for movement
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Update status to 'Available' once the target floor is reached
            if (elevator.currentFloor === elevator.targetFloor) {
                elevator.status = ElevatorStatus.Available;
                await elevatorService.updateElevator(elevator);
                const event = new ElevatorUpdatedEvent({
                    id: elevator.id,
                    currentFloor: elevator.currentFloor,
                    targetFloor: elevator.currentFloor,
                    load: elevator.load
                });
                await channel.sendToQueue(ELEVATOR_QUEUE, Buffer.from(JSON.stringify(event)));
                broadcastUpdate(await elevatorService.getStatus());
                clearTimeout(moveIntervals[elevator.id]);
                delete moveIntervals[elevator.id];
            }
        } catch (error) {
            console.error('Error moving elevator:', error);
        }
    };

    elevatorService.getStatus().then(elevators => {
        elevators.forEach(elevator => {
            if (!moveIntervals[elevator.id]) {
                moveIntervals[elevator.id] = setTimeout(() => moveElevator(elevator), 1000);
            }
        });
    });
}

function startWebSocketServer(elevatorService: ElevatorService) {
    const wss = new WebSocketServer({ port: WEBSOCKET_PORT });

    wss.on('connection', async (ws) => {
        clients.push(ws);
        console.log('Client connected');

        ws.on('message', (message) => {
            console.log('Received:', message);
        });

        ws.on('close', () => {
            const index = clients.indexOf(ws);
            if (index !== -1) {
                clients.splice(index, 1);
                console.log('Client disconnected');
            }
        });

        const status = await elevatorService.getStatus();
        ws.send(JSON.stringify(status));
    });

    console.log(`WebSocket server running on ws://localhost:${WEBSOCKET_PORT}`);
}

function broadcastUpdate(status: any) {
    const message = JSON.stringify(status);
    for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    }
}

startConsumer().catch(console.error);
