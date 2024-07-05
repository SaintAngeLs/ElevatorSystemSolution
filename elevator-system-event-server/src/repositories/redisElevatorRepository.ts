import { createClient } from 'redis';
import { config } from '../config';
import { Elevator, IElevatorRepository } from 'elevator-system-class-library';
import { InternalServerErrorException } from '../exceptions/InternalServerErrorException';
import { PickupRequestStatus } from '../enums/PickupRequestStatus';
import logger from '../logger';

const redisClient = createClient({
  url: config.redis.url,
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));

redisClient.connect();

export class RedisElevatorRepository implements IElevatorRepository {
  private elevatorsKey = 'elevators';
  private pickupRequestsKey = 'pickup_requests';

  async addElevator(elevator: Elevator): Promise<void> {
    try {
      await redisClient.hSet(this.elevatorsKey, elevator.id.toString(), JSON.stringify(elevator));
    } catch (error) {
      logger.error('Error adding elevator:', error);
      throw new InternalServerErrorException('Failed to add elevator');
    }
  }

  async getAll(): Promise<Elevator[]> {
    try {
      const elevators = await redisClient.hGetAll(this.elevatorsKey);
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
      const elevator = await redisClient.hGet(this.elevatorsKey, id.toString());
      if (elevator) {
        const parsed = JSON.parse(elevator);
        return new Elevator(
          parsed.id,
          parsed.currentFloor,
          parsed.capacity,
          parsed.targetFloor,
          parsed.load
        );
      }
      return undefined;
    } catch (error) {
      logger.error('Error getting elevator by ID:', error);
      throw new InternalServerErrorException('Failed to get elevator by ID');
    }
  }

  async update(elevator: Elevator): Promise<void> {
    try {
      await redisClient.hSet(this.elevatorsKey, elevator.id.toString(), JSON.stringify(elevator));
    } catch (error) {
      logger.error('Error updating elevator:', error);
      throw new InternalServerErrorException('Failed to update elevator');
    }
  }

  async updateAll(elevators: Elevator[]): Promise<void> {
    try {
      const multi = redisClient.multi();
      elevators.forEach((elevator) =>
        multi.hSet(this.elevatorsKey, elevator.id.toString(), JSON.stringify(elevator))
      );
      await multi.exec();
    } catch (error) {
      logger.error('Error updating all elevators:', error);
      throw new InternalServerErrorException('Failed to update all elevators');
    }
  }

  async deleteElevator(id: number): Promise<void> {
    try {
      await redisClient.hDel(this.elevatorsKey, id.toString());
    } catch (error) {
      logger.error('Error deleting elevator:', error);
      throw new InternalServerErrorException('Failed to delete elevator');
    }
  }

  // Pickup request related methods
  async addPickupRequest(floor: number, direction: number, status: PickupRequestStatus, elevatorId: number | null = null): Promise<void> {
    try {
      const request = { floor, direction, status, elevatorId };
      await redisClient.rPush(this.pickupRequestsKey, JSON.stringify(request));
    } catch (error) {
      logger.error('Error adding pickup request:', error);
      throw new InternalServerErrorException('Failed to add pickup request');
    }
  }

  async getNextPendingRequest(): Promise<any | null> {
    try {
      const requests = await redisClient.lRange(this.pickupRequestsKey, 0, -1);
      for (let request of requests) {
        const parsed = JSON.parse(request);
        if (parsed.status === 'Pending') {
          await redisClient.lRem(this.pickupRequestsKey, 1, request);
          return parsed;
        }
      }
      return null;
    } catch (error) {
      logger.error('Error getting next pending pickup request:', error);
      throw new InternalServerErrorException('Failed to get next pending pickup request');
    }
  }

  async updatePickupRequestStatus(floor: number, direction: number, newStatus: PickupRequestStatus, elevatorId: number | null = null): Promise<void> {
    try {
      const requests = await redisClient.lRange(this.pickupRequestsKey, 0, -1);
      for (let request of requests) {
        const parsed = JSON.parse(request);
        if (parsed.floor === floor && parsed.direction === direction) {
          parsed.status = newStatus;
          parsed.elevatorId = elevatorId;
          await redisClient.lRem(this.pickupRequestsKey, 1, request);
          await redisClient.rPush(this.pickupRequestsKey, JSON.stringify(parsed));
          break;
        }
      }
    } catch (error) {
      logger.error('Error updating pickup request status:', error);
      throw new InternalServerErrorException('Failed to update pickup request status');
    }
  }
}
