import amqp from 'amqplib';
import { ElevatorRepository, ElevatorService, ElevatorRequest } from 'elevator-system-class-library';
import WebSocket, { WebSocketServer } from 'ws';
import { RABBITMQ_URL, ELEVATOR_QUEUE, WEBSOCKET_PORT } from './config';

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
            await handleEvent(event, elevatorService);
            channel.ack(msg);
        }
    });

    startWebSocketServer(elevatorService);
}

async function handleEvent(event: any, elevatorService: ElevatorService) {
    switch (event.type) {
        case 'PICKUP_REQUEST':
            console.log('Handling pickup request:', event.payload);
            const pickupRequest = new ElevatorRequest(event.payload.floor, event.payload.direction);
            elevatorService.handlePickupRequest(pickupRequest);
            break;
        case 'UPDATE':
            console.log('Handling update:', event.payload);
            elevatorService.handleUpdate(event.payload.id, event.payload.currentFloor, event.payload.targetFloor, event.payload.load);
            break;
        case 'STEP':
            console.log('Handling step event:', event.payload);
            elevatorService.performStep();
            break;
        default:
            console.log('Unknown event type:', event.type);
    }
}

function startWebSocketServer(elevatorService: ElevatorService) {
    const wss = new WebSocketServer({ port: WEBSOCKET_PORT });

    wss.on('connection', (ws) => {
        console.log('Client connected');
        ws.on('message', (message) => {
            console.log('Received:', message);
        });

        ws.send(JSON.stringify(elevatorService.getStatus()));

        setInterval(() => {
            ws.send(JSON.stringify(elevatorService.getStatus()));
        }, 1000); 
    });

    console.log(`WebSocket server running on ws://localhost:${WEBSOCKET_PORT}`);
}

startConsumer().catch(console.error);
