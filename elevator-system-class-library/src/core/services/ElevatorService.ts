import { Elevator } from '../entities/Elevator';
import { ElevatorRequest } from '../entities/ElevatorRequest';
import { IElevatorRepository } from '../repositories/IElevatorRepository';

export class ElevatorService {
    constructor(private elevatorRepository: IElevatorRepository) {}

    addElevator(id: number, initialFloor: number, capacity: number): Elevator {
        const elevator = new Elevator(id, initialFloor, capacity);
        this.elevatorRepository.addElevator(elevator);
        return elevator;
    }

    handlePickupRequest(request: ElevatorRequest): Elevator {
        const elevators = this.elevatorRepository.getAll();
        const nearestElevator = this.findNearestElevator(elevators, request.floor);
        nearestElevator.updateTarget(request.floor);
        this.elevatorRepository.update(nearestElevator);
        return nearestElevator;
    }

    handleUpdate(id: number, currentFloor: number, targetFloor: number, load: number): Elevator | undefined {
        const elevator = this.elevatorRepository.getById(id);
        if (elevator) {
            elevator.currentFloor = currentFloor;
            elevator.updateTarget(targetFloor);
            elevator.load = load;
            this.elevatorRepository.update(elevator);
        }
        return elevator;
    }

    performStep() {
        const elevators = this.elevatorRepository.getAll();
        elevators.forEach(elevator => elevator.move());
        this.elevatorRepository.updateAll(elevators);
    }

    getStatus(): Elevator[] {
        return this.elevatorRepository.getAll();
    }

    private findNearestElevator(elevators: Elevator[], floor: number): Elevator {
        return elevators.reduce((prev, curr) =>
            Math.abs(curr.currentFloor - floor) < 
                        Math.abs(prev.currentFloor - floor) ? curr : prev
        );
    }
}
