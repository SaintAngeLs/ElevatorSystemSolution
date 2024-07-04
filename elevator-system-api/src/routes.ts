import { Application, Request, Response } from 'express';
import amqp from 'amqplib';
import { config } from './config';
import { ElevatorCreatedEvent } from './events/elevatorCreatedEvent';
import { ElevatorUpdatedEvent } from './events/elevatorUpdatedEvent';
import { GetElevatorStatusQuery } from './queries/GetElevatorStatusQuery';
import { GetAllElevatorsQuery } from './queries/GetAllElevatorsQuery';
import generateUuid from './utils/utils';

export async function setupRoutes(app: Application) {
    const connection = await amqp.connect(config.rabbitmq.url);
    const channel = await connection.createChannel();
    await channel.assertQueue(config.rabbitmq.queue, { durable: true });

    app.post('/elevator', async (req: Request, res: Response) => {
        const { id, initialFloor, capacity } = req.body;

        const event = new ElevatorCreatedEvent({ id, initialFloor, capacity });
        await channel.sendToQueue(config.rabbitmq.queue, Buffer.from(JSON.stringify(event)));

        res.status(201).send('Elevator created');
    });

    app.put('/elevator/:id', async (req: Request, res: Response) => {
        const { id } = req.params;
        const { currentFloor, targetFloor, load } = req.body;

        const event = new ElevatorUpdatedEvent({ id: Number(id), currentFloor, targetFloor, load });
        await channel.sendToQueue(config.rabbitmq.queue, Buffer.from(JSON.stringify(event)));

        res.status(200).send('Elevator updated');
    });

    app.get('/elevator/:id/status', async (req: Request, res: Response) => {
        const { id } = req.params;

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
                res.status(200).json(status);
                channel.ack(msg);
            }
        }, { noAck: false });
    });

    app.get('/elevators/status', async (_req: Request, res: Response) => {
        const query = new GetAllElevatorsQuery();
        const correlationId = generateUuid();
        const responseQueue = await channel.assertQueue('', { exclusive: true });

        channel.sendToQueue(config.rabbitmq.queue, Buffer.from(JSON.stringify(query)), {
            correlationId,
            replyTo: responseQueue.queue
        });

        channel.consume(responseQueue.queue, (msg: amqp.Message | null) => {
            if (msg?.properties.correlationId === correlationId) {
                const status = JSON.parse(msg.content.toString());
                res.status(200).json(status);
                channel.ack(msg);
            }
        }, { noAck: false });
    });
}

