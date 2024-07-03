import { Elevator } from '../entities/Elevator';

export interface IElevatorRepository {
    getAll(): Elevator[];
    getById(id: number): Elevator | undefined;
    update(elevator: Elevator): void;
    updateAll(elevators: Elevator[]): void;
    addElevator(elevator: Elevator): void;
}
