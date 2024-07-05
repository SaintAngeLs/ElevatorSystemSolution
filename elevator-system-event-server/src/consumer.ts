import amqp, { Channel } from 'amqplib';
import { ElevatorService, ElevatorRequest, Elevator } from 'elevator-system-class-library';
import { RABBITMQ_URL, ELEVATOR_QUEUE } from './config';
import { RedisElevatorRepository } from './repositories/redisElevatorRepository';
import { IConsumer } from './interfaces/IConsumer';
import logger from './logger';
import { IWebSocketServer } from './interfaces/IWebSocketServer';
import { ElevatorUpdatedEvent } from './events/elevatorUpdatedEvent';
import { ElevatorStatus } from './enums/ElevatorStatus';
import { InternalServerErrorException } from './exceptions/InternalServerErrorException';
import { NotFoundException } from './exceptions/NotFoundException';
import { BaseException } from './exceptions/BaseException';

export class RabbitMQConsumer implements IConsumer {
    private channel!: Channel;
    private elevatorService: ElevatorService;
    private webSocketServer: IWebSocketServer;
    private moveIntervals: { [key: number]: NodeJS.Timeout } = {};

    constructor(webSocketServer: IWebSocketServer) {
        const repository = new RedisElevatorRepository();
        this.elevatorService = new ElevatorService(repository);
        this.webSocketServer = webSocketServer;
    }

    async start(): Promise<void> {
        try {
            const connection = await amqp.connect(RABBITMQ_URL);
            this.channel = await connection.createChannel();
            await this.channel.assertQueue(ELEVATOR_QUEUE, { durable: true });

            logger.info(`Waiting for messages in ${ELEVATOR_QUEUE} queue...`);
            this.channel.consume(ELEVATOR_QUEUE, async (msg) => {
                if (msg !== null) {
                    const event = JSON.parse(msg.content.toString());
                    if (Object.keys(event).length === 0) {
                        logger.warn('Received empty message');
                    } else {
                        try {
                            await this.handleEvent(event, msg);
                        } catch (error: unknown) {
                            if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
                                logger.error((error as Error).message, { statusCode: (error as BaseException).statusCode });
                            } else if (error instanceof Error) {
                                logger.error('Unexpected error:', error);
                            } else {
                                logger.error('Unknown error:', error);
                            }
                        }
                        this.channel.ack(msg);
                    }
                }
            });
        } catch (error) {
            logger.error('Error starting RabbitMQ consumer:', error);
            throw new InternalServerErrorException('Failed to start RabbitMQ consumer');
        }
    }

    async handleEvent(event: any, msg: amqp.Message): Promise<void> {
        switch (event.type) {
            case 'PICKUP_REQUEST':
                logger.info('Handling pickup request:', event.payload);
                const assignedElevator = await this.elevatorService.handlePickupRequest(
                    new ElevatorRequest(event.payload.floor, event.payload.direction));
                if (assignedElevator) {
                    this.startContinuousBroadcast(assignedElevator);
                } else {
                    throw new NotFoundException('No elevator available for pickup request');
                }
                break;
            case 'ELEVATOR_UPDATED':
                logger.info('Handling update:', event.payload);
                await this.elevatorService.handleUpdate(
                    event.payload.id, event.payload.currentFloor, 
                    event.payload.targetFloor, event.payload.load);
                this.webSocketServer.broadcastUpdate(await this.elevatorService.getStatus());
                break;
            default:
                logger.warn('Unknown event type:', event.type);
        }
    }

    private startContinuousBroadcast(elevator: Elevator): void {
        const moveElevator = async (elevator: Elevator) => {
            try {
                while (elevator.currentFloor !== elevator.targetFloor && 
                    elevator.targetFloor !== null) {
                    elevator.status = ElevatorStatus.Moving;
                    await this.elevatorService.updateElevator(elevator);

                    const event = new ElevatorUpdatedEvent({
                        id: elevator.id,
                        currentFloor: elevator.currentFloor,
                        targetFloor: elevator.targetFloor!,
                        load: elevator.load
                    });
                    await this.channel.sendToQueue(ELEVATOR_QUEUE, Buffer.from(JSON.stringify(event)));
                    this.webSocketServer.broadcastUpdate(await this.elevatorService.getStatus());

                    await new Promise(resolve => setTimeout(resolve, 3000));

                    elevator.move();
                    await this.elevatorService.updateElevator(elevator);
                }

                if (elevator.currentFloor === elevator.targetFloor) {
                    elevator.status = ElevatorStatus.Available;
                    await this.elevatorService.updateElevator(elevator);
                    const event = new ElevatorUpdatedEvent({
                        id: elevator.id,
                        currentFloor: elevator.currentFloor,
                        targetFloor: elevator.currentFloor,
                        load: elevator.load
                    });
                    await this.channel.sendToQueue(ELEVATOR_QUEUE, Buffer.from(JSON.stringify(event)));
                    this.webSocketServer.broadcastUpdate(await this.elevatorService.getStatus());
                    clearTimeout(this.moveIntervals[elevator.id]);
                    delete this.moveIntervals[elevator.id];
                }
            } catch (error: unknown) {
                logger.error('Error moving elevator:', error);
                throw new InternalServerErrorException('Failed to move elevator');
            }
        };

        if (!this.moveIntervals[elevator.id]) {
            this.moveIntervals[elevator.id] = setTimeout(() => moveElevator(elevator), 3000);
        }
    }
}
