// src/routes.ts
import { Application, Request, Response } from 'express';
import amqp, { Channel } from 'amqplib';
import { config } from './config';
import { ElevatorCreatedEvent } from './events/elevatorCreatedEvent';
import { ElevatorUpdatedEvent } from './events/elevatorUpdatedEvent';
import { RedisElevatorRepository } from './repositories/redisElevatorRepository';
import { Elevator, ElevatorService } from 'elevator-system-class-library';
import redisClient from './redisClient';
import { PickupRequestCommand } from './commands/pickupRequestCommand';
import { PickupRequestHandler } from './commandHandlers/pickupRequestHandler';
import { PickupRequestEvent } from './events/pickupRequestEvent';
import { ElevatorStatus } from './enums/ElevatorStatus';
import logger from './logger';

const BUILDING_KEY = 'building_config';

export async function setupRoutes(app: Application) {
  const connection = await amqp.connect(config.rabbitmq.url);
  const channel = await connection.createChannel();
  await channel.assertQueue(config.rabbitmq.queue, { durable: true });
  const elevatorRepository = new RedisElevatorRepository();
  const elevatorService = new ElevatorService(elevatorRepository);
  const pickupRequestHandler = new PickupRequestHandler(elevatorService);

  app.post('/building', async (req: Request, res: Response) => {
    try {
      const { floors, maxElevators } = req.body;
      logger.info('Received request to create/update building:', { floors, maxElevators });
      const buildingConfig = { floors, maxElevators };
      await redisClient.set(BUILDING_KEY, JSON.stringify(buildingConfig));
      logger.info('Building configuration saved to Redis');
      res.status(201).send('Building configuration saved');
    } catch (error) {
      logger.error('Error in POST /building:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  app.get('/building', async (_req: Request, res: Response) => {
    try {
      logger.info('Received request to get building configuration');
      const buildingConfig = await redisClient.get(BUILDING_KEY);
      if (buildingConfig) {
        res.status(200).json(JSON.parse(buildingConfig));
      } else {
        res.status(404).send('Building configuration not found');
      }
    } catch (error) {
      logger.error('Error in GET /building:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  app.post('/elevator', async (req: Request, res: Response) => {
    try {
      const { id, initialFloor, capacity } = req.body;
      logger.info('Received request to create elevator:', { id, initialFloor, capacity });
      const elevator = new Elevator(id, initialFloor, capacity);
      await elevatorRepository.addElevator(elevator);
      const event = new ElevatorCreatedEvent({ id, initialFloor, capacity });
      await channel.sendToQueue(config.rabbitmq.queue, Buffer.from(JSON.stringify(event)));
      logger.info(`Elevator created event sent to queue for ID: ${id}`);
      res.status(201).send('Elevator created');
    } catch (error) {
      logger.error('Error in POST /elevator:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  app.put('/elevator/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { currentFloor, targetFloor, load } = req.body;
      logger.info('Received request to update elevator:', { id, currentFloor, targetFloor, load });
      const elevator = await elevatorRepository.getById(Number(id));
      if (elevator) {
        elevator.currentFloor = currentFloor;
        elevator.updateTarget(targetFloor);
        elevator.load = load;
        await elevatorRepository.update(elevator);
        const event = new ElevatorUpdatedEvent({ id: Number(id), currentFloor, targetFloor, load });
        await channel.sendToQueue(config.rabbitmq.queue, Buffer.from(JSON.stringify(event)));
        logger.info(`Elevator updated event sent to queue for ID: ${id}`);
        res.status(200).send('Elevator updated');
      } else {
        res.status(404).send('Elevator not found');
      }
    } catch (error) {
      logger.error('Error in PUT /elevator/:id:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  app.delete('/elevator/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      logger.info(`Received request to delete elevator ID: ${id}`);
      await elevatorRepository.deleteElevator(Number(id));
      logger.info(`Elevator ID: ${id} deleted from Redis`);
      res.status(200).send(`Elevator ID: ${id} deleted`);
    } catch (error) {
      logger.error('Error in DELETE /elevator/:id:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  app.get('/elevators/status', async (_req: Request, res: Response) => {
    try {
      logger.info('Received request to get status for all elevators');
      const elevators = await elevatorRepository.getAll();
      logger.info('Fetched elevators from Redis:', elevators);
      res.status(200).json(elevators);
    } catch (error) {
      logger.error('Error in GET /elevators/status:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  app.post('/pickup', async (req: Request, res: Response) => {
    try {
      const { floor, direction } = req.body;
      logger.info('Received pickup request:', { floor, direction });
      const pickupRequestCommand = new PickupRequestCommand(Number(floor), Number(direction));
      await pickupRequestHandler.handle(pickupRequestCommand);
      const event = new PickupRequestEvent({ floor: Number(floor), direction: Number(direction) });
      await channel.sendToQueue(config.rabbitmq.queue, Buffer.from(JSON.stringify(event)));
      logger.info(`Pickup request event sent to queue for Floor: ${floor}`);
      const elevators = await elevatorService.getStatus();
      const selectedElevator = elevatorService.findLeastRecentlyAvailableElevator(elevators);
      if (selectedElevator) {
        selectedElevator.updateTarget(Number(floor));
        await elevatorRepository.update(selectedElevator);
        await moveElevatorAndBroadcast(selectedElevator, elevatorService, channel);
        res.status(200).send('Pickup request sent and elevator is moving');
      } else {
        res.status(404).send('No available elevators');
      }
    } catch (error) {
      logger.error('Error in POST /pickup:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  async function moveElevatorAndBroadcast(elevator: Elevator, elevatorService: ElevatorService, channel: Channel) {
    try {
      while (elevator.currentFloor !== elevator.targetFloor && elevator.targetFloor !== null) {
        elevator.move();
        await elevatorRepository.update(elevator);
        const event = new ElevatorUpdatedEvent({
          id: elevator.id,
          currentFloor: elevator.currentFloor,
          targetFloor: elevator.targetFloor!,
          load: elevator.load
        });
        await channel.sendToQueue(config.rabbitmq.queue, Buffer.from(JSON.stringify(event)));
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      if (elevator.currentFloor === elevator.targetFloor) {
        elevator.status = ElevatorStatus.Available;
        await elevatorRepository.update(elevator);
        const event = new ElevatorUpdatedEvent({
          id: elevator.id,
          currentFloor: elevator.currentFloor,
          targetFloor: elevator.currentFloor,
          load: elevator.load
        });
        await channel.sendToQueue(config.rabbitmq.queue, Buffer.from(JSON.stringify(event)));
      }
    } catch (error) {
      logger.error('Error in moveElevatorAndBroadcast:', error);
    }
  }
}
