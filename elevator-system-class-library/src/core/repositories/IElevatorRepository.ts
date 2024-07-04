import { Elevator } from '../entities/Elevator';

export interface IElevatorRepository {
    getAll(): Promise<Elevator[]>;
    getById(id: number): Promise<Elevator | undefined>;
    update(elevator: Elevator): Promise<void>;
    updateAll(elevators: Elevator[]): Promise<void>;
    addElevator(elevator: Elevator): Promise<void>;
}