import { Elevator } from '../entities/Elevator';
import { ElevatorRequest } from '../entities/ElevatorRequest';
import { ElevatorStatus } from '../entities/ElevatorStatus';
import { IElevatorRepository } from '../repositories/IElevatorRepository';
import { 
    ElevatorNotFoundException, 
    InternalServerErrorException, 
    InvalidFloorException, 
    CapacityExceededException 
} from '../exceptions';

export class ElevatorService {
    private lastAvailableTime: Map<number, number>;

    constructor(private elevatorRepository: IElevatorRepository) {
        this.lastAvailableTime = new Map<number, number>();
    }

    async addElevator(id: number, 
        initialFloor: number, 
        capacity: number): Promise<Elevator> {
        try {
            const elevator = new Elevator(id, initialFloor, capacity);
            this.lastAvailableTime.set(id, Date.now());
            await this.elevatorRepository.addElevator(elevator);
            return elevator;
        } catch (error) {
            throw new InternalServerErrorException('Failed to add elevator');
        }
    }

    async handlePickupRequest(request: ElevatorRequest): Promise<Elevator | null> {
        try {
            const elevators = await this.elevatorRepository.getAll();

            if (elevators.length === 0) {
                throw new ElevatorNotFoundException(0); 
            }

            const selectedElevator = this.findLeastRecentlyAvailableElevator(elevators);
            if (selectedElevator && selectedElevator.status === ElevatorStatus.Available) {
                if (request.floor < 0) {
                    throw new InvalidFloorException();
                }
                selectedElevator.updateTarget(request.floor);
                selectedElevator.status = ElevatorStatus.Moving;
                this.lastAvailableTime.set(selectedElevator.id, Date.now());
                await this.elevatorRepository.update(selectedElevator);
                return selectedElevator;
            }
            return null;
        } catch (error) {
            if (error instanceof ElevatorNotFoundException || error instanceof InvalidFloorException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to handle pickup request');
        }
    }

    async updateElevator(elevator: Elevator): Promise<void> {
        try {
            await this.elevatorRepository.update(elevator);
        } catch (error) {
            throw new InternalServerErrorException('Failed to update elevator');
        }
    }

    async handleUpdate(id: number, 
        currentFloor: number, 
        targetFloor: number, 
        load: number): Promise<Elevator | undefined> {
        try {
            const elevator = await this.elevatorRepository.getById(id);
            if (elevator) {
                if (targetFloor < 0) {
                    throw new InvalidFloorException();
                }
                if (load > elevator.capacity) {
                    throw new CapacityExceededException();
                }
                elevator.currentFloor = currentFloor;
                elevator.updateTarget(targetFloor);
                elevator.load = load;
                if (elevator.status === ElevatorStatus.Available) {
                    this.lastAvailableTime.set(elevator.id, Date.now());
                }
                await this.elevatorRepository.update(elevator);
                return elevator;
            } else {
                throw new ElevatorNotFoundException(id);
            }
        } catch (error) {
            if (error instanceof ElevatorNotFoundException || 
                error instanceof InvalidFloorException || 
                error instanceof CapacityExceededException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to handle update');
        }
    }

    async performStep(): Promise<void> {
        try {
            const elevators = await this.elevatorRepository.getAll();
            for (const elevator of elevators) {
                if (elevator.status === ElevatorStatus.Moving) {
                    elevator.move();
                    await this.elevatorRepository.update(elevator);
                }
            }
        } catch (error) {
            throw new InternalServerErrorException('Failed to perform step');
        }
    }

    async startMovement(broadcastUpdate: (status: any) => void): Promise<void> {
        const moveInterval = setInterval(async () => {
            await this.performStep();
            const elevators = await this.elevatorRepository.getAll();
            broadcastUpdate(elevators);
            const anyMoving = elevators.some(elevator => elevator.status === ElevatorStatus.Moving);
            if (!anyMoving) {
                clearInterval(moveInterval);
            }
        }, 1000);
    }

    async getStatus(): Promise<Elevator[]> {
        try {
            return await this.elevatorRepository.getAll();
        } catch (error) {
            throw new InternalServerErrorException('Failed to get status');
        }
    }

    public findLeastRecentlyAvailableElevator(elevators: Elevator[]): Elevator | null {
        const availableElevators = elevators.filter(elevator => elevator.status === ElevatorStatus.Available);
        if (availableElevators.length === 0) {
            return null;
        }
        return availableElevators.reduce((prev, curr) => 
            (this.lastAvailableTime.get(prev.id) || 0) < (this.lastAvailableTime.get(curr.id) || 0) ? prev : curr
        );
    }
}
