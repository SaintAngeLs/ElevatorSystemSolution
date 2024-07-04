import { Elevator } from '../entities/Elevator';
import { ElevatorRequest } from '../entities/ElevatorRequest';
import { IElevatorRepository } from '../repositories/IElevatorRepository';

export class ElevatorService {
    constructor(private elevatorRepository: IElevatorRepository) {}

    async addElevator(id: number, initialFloor: number, capacity: number): Promise<Elevator> {
        const elevator = new Elevator(id, initialFloor, capacity);
        await this.elevatorRepository.addElevator(elevator);
        return elevator;
    }

    async handlePickupRequest(request: ElevatorRequest): Promise<Elevator> {
        const elevators = await this.elevatorRepository.getAll();
        const nearestElevator = this.findNearestElevator(elevators, request.floor);
        nearestElevator.updateTarget(request.floor);
        await this.elevatorRepository.update(nearestElevator);
        return nearestElevator;
    }

    async handleUpdate(id: number, currentFloor: number, targetFloor: number, load: number): Promise<Elevator | undefined> {
        const elevator = await this.elevatorRepository.getById(id);
        if (elevator) {
            elevator.currentFloor = currentFloor;
            elevator.updateTarget(targetFloor);
            elevator.load = load;
            await this.elevatorRepository.update(elevator);
        }
        return elevator;
    }

    async performStep(): Promise<void> {
        const elevators = await this.elevatorRepository.getAll();
        elevators.forEach(elevator => elevator.move());
        await this.elevatorRepository.updateAll(elevators);
    }

    async getStatus(): Promise<Elevator[]> {
        return this.elevatorRepository.getAll();
    }

    private findNearestElevator(elevators: Elevator[], floor: number): Elevator {
        return elevators.reduce((prev, curr) =>
            Math.abs(curr.currentFloor - floor) < 
                        Math.abs(prev.currentFloor - floor) ? curr : prev
        );
    }
}
