import { Application, Request, Response } from 'express';
import amqp from 'amqplib';
import { config } from './config';
import { ElevatorCreatedEvent } from './events/elevatorCreatedEvent';
import { ElevatorUpdatedEvent } from './events/elevatorUpdatedEvent';
import { PickupRequestEvent } from './events/pickupRequestEvent';
import { RedisElevatorRepository } from './repositories/redisElevatorRepository';
import { Elevator, ElevatorStatus } from 'elevator-system-class-library';
import redisClient from './redisClient';

const BUILDING_KEY = 'building_config';

export async function setupRoutes(app: Application) {
    const connection = await amqp.connect(config.rabbitmq.url);
    const channel = await connection.createChannel();
    await channel.assertQueue(config.rabbitmq.queue, { durable: true });
    const elevatorRepository = new RedisElevatorRepository();

    app.post('/building', async (req: Request, res: Response) => {
        const { floors, maxElevators } = req.body;

        console.log('Received request to create/update building:');
        console.log(`Floors: ${floors}, Max Elevators: ${maxElevators}`);

        const buildingConfig = { floors, maxElevators };
        await redisClient.set(BUILDING_KEY, JSON.stringify(buildingConfig));

        console.log('Building configuration saved to Redis');
        res.status(201).send('Building configuration saved');
    });

    app.get('/building', async (_req: Request, res: Response) => {
        console.log('Received request to get building configuration');

        const buildingConfig = await redisClient.get(BUILDING_KEY);
        if (buildingConfig) {
            res.status(200).json(JSON.parse(buildingConfig));
        } else {
            res.status(404).send('Building configuration not found');
        }
    });

    app.post('/elevator', async (req: Request, res: Response) => {
        const { id, initialFloor, capacity } = req.body;

        console.log('Received request to create elevator:');
        console.log(`ID: ${id}, Initial Floor: ${initialFloor}, Capacity: ${capacity}`);

        const elevator = new Elevator(id, initialFloor, capacity);
        await elevatorRepository.addElevator(elevator);

        const event = new ElevatorCreatedEvent({ id, initialFloor, capacity });
        await channel.sendToQueue(config.rabbitmq.queue, Buffer.from(JSON.stringify(event)));

        console.log(`Elevator created event sent to queue for ID: ${id}`);
        res.status(201).send('Elevator created');
    });

    app.put('/elevator/:id', async (req: Request, res: Response) => {
        const { id } = req.params;
        const { currentFloor, targetFloor, load } = req.body;

        console.log('Received request to update elevator:');
        console.log(`ID: ${id}, Current Floor: ${currentFloor}, Target Floor: ${targetFloor}, Load: ${load}`);

        const elevator = await elevatorRepository.getById(Number(id));
        if (elevator) {
            elevator.currentFloor = currentFloor;
            elevator.updateTarget(targetFloor);
            elevator.load = load;
            await elevatorRepository.update(elevator);

            const event = new ElevatorUpdatedEvent({ id: Number(id), currentFloor, targetFloor, load });
            await channel.sendToQueue(config.rabbitmq.queue, Buffer.from(JSON.stringify(event)));

            console.log(`Elevator updated event sent to queue for ID: ${id}`);
            res.status(200).send('Elevator updated');
        } else {
            res.status(404).send('Elevator not found');
        }
    });

    app.delete('/elevator/:id', async (req: Request, res: Response) => {
        const { id } = req.params;

        console.log(`Received request to delete elevator ID: ${id}`);

        await elevatorRepository.deleteElevator(Number(id));
        console.log(`Elevator ID: ${id} deleted from Redis`);
        res.status(200).send(`Elevator ID: ${id} deleted`);
    });

    app.get('/elevators/status', async (_req: Request, res: Response) => {
        console.log('Received request to get status for all elevators');

        const elevators = await elevatorRepository.getAll();
        console.log('Fetched elevators from Redis:', elevators);
        res.status(200).json(elevators);
    });

    app.post('/pickup', async (req: Request, res: Response) => {
        const { floor, direction } = req.body;

        console.log('Received pickup request:');
        console.log(`Floor: ${floor}, Direction: ${direction}`);

        const event = new PickupRequestEvent({ floor, direction });
        await channel.sendToQueue(config.rabbitmq.queue, Buffer.from(JSON.stringify(event)));

        console.log(`Pickup request event sent to queue for Floor: ${floor}`);
        res.status(200).send('Pickup request sent');
    });
}
