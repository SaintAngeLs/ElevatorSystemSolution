import { Elevator } from '../entities/Elevator';
import { IElevatorRepository } from './IElevatorRepository';

export class ElevatorRepository implements IElevatorRepository {
    private elevators: Elevator[] = [];

    async addElevator(elevator: Elevator): Promise<void> {
        this.elevators.push(elevator);
    }

    async getAll(): Promise<Elevator[]> {
        return this.elevators;
    }

    async getById(id: number): Promise<Elevator | undefined> {
        return this.elevators.find(elevator => elevator.id === id);
    }

    async update(elevator: Elevator): Promise<void> {
        const index = this.elevators.findIndex(e => e.id === elevator.id);
        if (index !== -1) {
            this.elevators[index] = elevator;
        }
    }

    async updateAll(elevators: Elevator[]): Promise<void> {
        elevators.forEach(elevator => this.update(elevator));
    }
}