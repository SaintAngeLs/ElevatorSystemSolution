declare module 'elevator-system-api/dist/repositories/redisElevatorRepository' {
    import { Elevator, IElevatorRepository } from 'elevator-system-class-library';

    export class RedisElevatorRepository implements IElevatorRepository {
        addElevator(elevator: Elevator): Promise<void>;
        getAll(): Promise<Elevator[]>;
        getById(id: number): Promise<Elevator | undefined>;
        update(elevator: Elevator): Promise<void>;
        updateAll(elevators: Elevator[]): Promise<void>;
        deleteElevator(id: number): Promise<void>;
    }
}
