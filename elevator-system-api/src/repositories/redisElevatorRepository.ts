import { IElevatorRepository, Elevator } from 'elevator-system-class-library';
import redisClient from '../redisClient';

export class RedisElevatorRepository implements IElevatorRepository {
  private readonly prefix = 'elevator:';

  async addElevator(elevator: Elevator): Promise<void> {
    await redisClient.set(`${this.prefix}${elevator.id}`, JSON.stringify(elevator));
  }

  async getAll(): Promise<Elevator[]> {
    const keys = await redisClient.keys(`${this.prefix}*`);
    const elevators = await Promise.all(keys.map((key) => redisClient.get(key)));
    return elevators.map((elevator) => JSON.parse(elevator || '{}'));
  }

  async getById(id: number): Promise<Elevator | undefined> {
    const elevator = await redisClient.get(`${this.prefix}${id}`);
    return elevator ? JSON.parse(elevator) : undefined;
  }

  async update(elevator: Elevator): Promise<void> {
    await redisClient.set(`${this.prefix}${elevator.id}`, JSON.stringify(elevator));
  }

  async updateAll(elevators: Elevator[]): Promise<void> {
    const pipeline = redisClient.multi();
    elevators.forEach((elevator) => {
      pipeline.set(`${this.prefix}${elevator.id}`, JSON.stringify(elevator));
    });
    await pipeline.exec();
  }
}
