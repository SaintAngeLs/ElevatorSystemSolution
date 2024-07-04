import { Application, Request, Response } from 'express';
import amqp from 'amqplib';
import { config } from './config';
import { ElevatorCreatedEvent } from './events/elevatorCreatedEvent';
import { ElevatorUpdatedEvent } from './events/elevatorUpdatedEvent';
import { GetElevatorStatusQuery } from './queries/GetElevatorStatusQuery';
import { GetAllElevatorsQuery } from './queries/GetAllElevatorsQuery';
import generateUuid from './utils/utils';
import { RedisElevatorRepository } from './repositories/redisElevatorRepository';
import { Elevator } from 'elevator-system-class-library';

export async function setupRoutes(app: Application) {
    const connection = await amqp.connect(config.rabbitmq.url);
    const channel = await connection.createChannel();
    await channel.assertQueue(config.rabbitmq.queue, { durable: true });
    const elevatorRepository = new RedisElevatorRepository();

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

        const event = new ElevatorUpdatedEvent({ id: Number(id), currentFloor, targetFloor, load });
        await channel.sendToQueue(config.rabbitmq.queue, Buffer.from(JSON.stringify(event)));

        console.log(`Elevator updated event sent to queue for ID: ${id}`);
        res.status(200).send('Elevator updated');
    });

    app.delete('/elevator/:id', async (req: Request, res: Response) => {
        const { id } = req.params;

        console.log(`Received request to delete elevator ID: ${id}`);

        await elevatorRepository.deleteElevator(Number(id));
        console.log(`Elevator ID: ${id} deleted from Redis`);
        res.status(200).send(`Elevator ID: ${id} deleted`);
    });

    app.get('/elevator/:id/status', async (req: Request, res: Response) => {
        const { id } = req.params;

        console.log(`Received request to get status for elevator ID: ${id}`);

        const query = new GetElevatorStatusQuery(Number(id));
        const correlationId = generateUuid();
        const responseQueue = await channel.assertQueue('', { exclusive: true });

        channel.sendToQueue(config.rabbitmq.queue, Buffer.from(JSON.stringify(query)), {
            correlationId,
            replyTo: responseQueue.queue
        });

        channel.consume(responseQueue.queue, (msg: amqp.Message | null) => {
            if (msg?.properties.correlationId === correlationId) {
                const status = JSON.parse(msg.content.toString());
                console.log(`Sending status for elevator ID: ${id}`, status);
                res.status(200).json(status);
                channel.ack(msg);
            }
        }, { noAck: false });
    });

    // app.get('/elevators/status', async (_req: Request, res: Response) => {
    //     console.log('Received request to get status for all elevators');

    //     const query = new GetAllElevatorsQuery();
    //     const correlationId = generateUuid();
    //     const responseQueue = await channel.assertQueue('', { exclusive: true });

    //     channel.sendToQueue(config.rabbitmq.queue, Buffer.from(JSON.stringify(query)), {
    //         correlationId,
    //         replyTo: responseQueue.queue
    //     });

    //     channel.consume(responseQueue.queue, (msg: amqp.Message | null) => {
    //         if (msg?.properties.correlationId === correlationId) {
    //             const status = JSON.parse(msg.content.toString());
    //             console.log('Response from RabbitMQ:', status); // Log the response here
    //             console.log('Sending status for all elevators', status);
    //             res.status(200).json(status);
    //             channel.ack(msg);
    //         }
    //     }, { noAck: false });
    // });


    app.get('/elevators/status', async (_req: Request, res: Response) => {
        console.log('Received request to get status for all elevators');

        const elevators = await elevatorRepository.getAll();
        console.log('Fetched elevators from Redis:', elevators);
        res.status(200).json(elevators);
    });
}
