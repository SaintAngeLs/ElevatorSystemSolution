import { Elevator } from '../entities/Elevator';
import { IElevatorRepository } from './IElevatorRepository';

export class InMemoryElevatorRepository implements IElevatorRepository {
    private elevators: Elevator[] = [];

    constructor() {}

    addElevator(elevator: Elevator): void {
        this.elevators.push(elevator);
    }

    getAll(): Elevator[] {
        return this.elevators;
    }

    getById(id: number): Elevator | undefined {
        return this.elevators.find(elevator => elevator.id === id);
    }

    update(elevator: Elevator): void {
        const index = this.elevators.findIndex(e => e.id === elevator.id);
        if (index !== -1) {
            this.elevators[index] = elevator;
        }
    }

    updateAll(elevators: Elevator[]): void {
        elevators.forEach(elevator => this.update(elevator));
    }
}
