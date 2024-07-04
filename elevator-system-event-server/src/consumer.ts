import amqp from 'amqplib';
import { ElevatorRepository, ElevatorService, ElevatorRequest } from 'elevator-system-class-library';
import WebSocket, { WebSocketServer } from 'ws';
import { RABBITMQ_URL, ELEVATOR_QUEUE, WEBSOCKET_PORT } from './config';

const clients: WebSocket[] = [];

async function startConsumer() {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(ELEVATOR_QUEUE, { durable: true });

    const repository = new ElevatorRepository();
    const elevatorService = new ElevatorService(repository);

    console.log(`Waiting for messages in ${ELEVATOR_QUEUE} queue...`);
    channel.consume(ELEVATOR_QUEUE, async (msg) => {
        if (msg !== null) {
            const event = JSON.parse(msg.content.toString());
            if (Object.keys(event).length === 0) {
                console.warn('Received empty message');
            } else {
                await handleEvent(event, elevatorService);
                const status = await elevatorService.getStatus();
                broadcastUpdate(status);
                channel.ack(msg);
            }
        }
    });

    startWebSocketServer(elevatorService);
}

async function handleEvent(event: any, elevatorService: ElevatorService) {
    switch (event.type) {
        case 'PICKUP_REQUEST':
            console.log('Handling pickup request:', event.payload);
            const pickupRequest = new ElevatorRequest(event.payload.floor, event.payload.direction);
            await elevatorService.handlePickupRequest(pickupRequest);
            break;
        case 'ELEVATOR_UPDATED':
            console.log('Handling update:', event.payload);
            await elevatorService.handleUpdate(event.payload.id, event.payload.currentFloor, event.payload.targetFloor, event.payload.load);
            break;
        case 'STEP':
            console.log('Handling step event:', event.payload);
            await elevatorService.performStep();
            break;
        default:
            console.log('Unknown event type:', event.type);
    }
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
