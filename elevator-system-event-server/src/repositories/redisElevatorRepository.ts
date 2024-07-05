import { createClient } from 'redis';
import { redis } from '../config';
import { Elevator, IElevatorRepository } from 'elevator-system-class-library';
import { InternalServerErrorException } from '../exceptions/InternalServerErrorException';
import { NotFoundException } from '../exceptions/NotFoundException';
import logger from '../logger';

const redisClient = createClient({
  url: redis.url,
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));

redisClient.connect();

export class RedisElevatorRepository implements IElevatorRepository {
  async addElevator(elevator: Elevator): Promise<void> {
    try {
      await redisClient.hSet('elevators', elevator.id.toString(), JSON.stringify(elevator));
    } catch (error) {
      logger.error('Error adding elevator:', error);
      throw new InternalServerErrorException('Failed to add elevator');
    }
  }

  async getAll(): Promise<Elevator[]> {
    try {
      const elevators = await redisClient.hGetAll('elevators');
      return Object.values(elevators).map((elevator) => {
        const parsed = JSON.parse(elevator);
        return new Elevator(
          parsed.id,
          parsed.currentFloor,
          parsed.capacity,
          parsed.targetFloor,
          parsed.load
        );
      });
    } catch (error) {
      logger.error('Error getting all elevators:', error);
      throw new InternalServerErrorException('Failed to get all elevators');
    }
  }

  async getById(id: number): Promise<Elevator | undefined> {
    try {
      const elevator = await redisClient.hGet('elevators', id.toString());
      if (elevator) {
        const parsed = JSON.parse(elevator);
        return new Elevator(
          parsed.id,
          parsed.currentFloor,
          parsed.capacity,
          parsed.targetFloor,
          parsed.load
        );
      } else {
        throw new NotFoundException(`Elevator with ID ${id} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      logger.error('Error getting elevator by ID:', error);
      throw new InternalServerErrorException('Failed to get elevator by ID');
    }
  }

  async update(elevator: Elevator): Promise<void> {
    try {
      await redisClient.hSet('elevators', elevator.id.toString(), JSON.stringify(elevator));
    } catch (error) {
      logger.error('Error updating elevator:', error);
      throw new InternalServerErrorException('Failed to update elevator');
    }
  }

  async updateAll(elevators: Elevator[]): Promise<void> {
    try {
      const multi = redisClient.multi();
      elevators.forEach((elevator) =>
        multi.hSet('elevators', elevator.id.toString(), JSON.stringify(elevator))
      );
      await multi.exec();
    } catch (error) {
      logger.error('Error updating all elevators:', error);
      throw new InternalServerErrorException('Failed to update all elevators');
    }
  }

  async deleteElevator(id: number): Promise<void> {
    try {
      await redisClient.hDel('elevators', id.toString());
    } catch (error) {
      logger.error('Error deleting elevator:', error);
      throw new InternalServerErrorException('Failed to delete elevator');
    }
  }
}
