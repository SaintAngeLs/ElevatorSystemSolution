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

        if (elevators.length === 0) {
            throw new Error('No elevators available');
        }

        const nearestElevator = this.findNearestElevator(elevators, request.floor);
        if (nearestElevator.status === 'Available' || nearestElevator.currentFloor === nearestElevator.targetFloor) {
            nearestElevator.updateTarget(request.floor);
            await this.elevatorRepository.update(nearestElevator);
        }
        return nearestElevator;
    }

    async updateElevator(elevator: Elevator): Promise<void> {
        await this.elevatorRepository.update(elevator);
    }

    async handleUpdate(id: number, currentFloor: number, targetFloor: number, load: number): Promise<Elevator | undefined> {
        const elevator = await this.elevatorRepository.getById(id);
        if (elevator) {
            elevator.currentFloor = currentFloor;
            elevator.updateTarget(targetFloor);
            elevator.load = load;
            await this.elevatorRepository.update(elevator);
            return elevator;
        }
        return undefined;
    }

    async performStep(): Promise<void> {
        const elevators = await this.elevatorRepository.getAll();
        elevators.forEach(elevator => {
            elevator.move();
        });
        await this.elevatorRepository.updateAll(elevators);
    }

    async startMovement(broadcastUpdate: (status: any) => void): Promise<void> {
        const moveInterval = setInterval(async () => {
            await this.performStep();
            const elevators = await this.elevatorRepository.getAll();
            broadcastUpdate(elevators);  // Broadcast update after each step
            const anyMoving = elevators.some(elevator => elevator.status === 'Moving');
            if (!anyMoving) {
                clearInterval(moveInterval);
            }
        }, 1000); // Adjust the interval to 1000ms for visibility
    }

    async getStatus(): Promise<Elevator[]> {
        return this.elevatorRepository.getAll();
    }

    public findNearestElevator(elevators: Elevator[], floor: number): Elevator {
        if (elevators.length === 0) {
            throw new Error('No elevators available');
        }
        return elevators.reduce((prev, curr) =>
            Math.abs(curr.currentFloor - floor) < 
            Math.abs(prev.currentFloor - floor) ? curr : prev
        );
    }
}
