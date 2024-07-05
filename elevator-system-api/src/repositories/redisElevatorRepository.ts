import { createClient } from 'redis';
import { config } from '../config';
import { Elevator, IElevatorRepository } from 'elevator-system-class-library';

const redisClient = createClient({
  url: config.redis.url,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

redisClient.connect();

export class RedisElevatorRepository implements IElevatorRepository {
  async addElevator(elevator: Elevator): Promise<void> {
    await redisClient.hSet('elevators', elevator.id.toString(), JSON.stringify(elevator));
  }

  async getAll(): Promise<Elevator[]> {
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
  }

  async getById(id: number): Promise<Elevator | undefined> {
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
    }
    return undefined;
  }

  async update(elevator: Elevator): Promise<void> {
    await redisClient.hSet('elevators', elevator.id.toString(), JSON.stringify(elevator));
  }

  async updateAll(elevators: Elevator[]): Promise<void> {
    const multi = redisClient.multi();
    elevators.forEach((elevator) =>
      multi.hSet('elevators', elevator.id.toString(), JSON.stringify(elevator))
    );
    await multi.exec();
  }

  async deleteElevator(id: number): Promise<void> {
    await redisClient.hDel('elevators', id.toString());
  }
}
