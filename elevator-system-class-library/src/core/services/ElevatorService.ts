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
import { PickupRequestStatus } from '../entities/PickupRequestStatus';

export class ElevatorService {
    private lastAvailableTime: Map<number, number>;

    constructor(private elevatorRepository: IElevatorRepository) {
        this.lastAvailableTime = new Map<number, number>();
    }

    async addElevator(id: number, initialFloor: number, capacity: number): Promise<Elevator> {
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

            const assignedRequest = await this.elevatorRepository.getNextPendingRequest();
            if (assignedRequest && assignedRequest.elevatorId !== null) {
                const assignedElevator = await this.elevatorRepository.getById(assignedRequest.elevatorId);
                if (assignedElevator && assignedElevator.status === ElevatorStatus.Moving) {
                    return assignedElevator;
                }
            }

            const selectedElevator = this.findBestElevator(elevators, request.floor);
            if (selectedElevator) {
                if (request.floor < 0) {
                    throw new InvalidFloorException();
                }
                selectedElevator.updateTarget(request.floor);
                selectedElevator.status = ElevatorStatus.Moving;
                this.lastAvailableTime.set(selectedElevator.id, Date.now());
                await this.elevatorRepository.update(selectedElevator);
                await this.elevatorRepository.updatePickupRequestStatus(request.floor, request.direction, PickupRequestStatus.Processing, selectedElevator.id);
                return selectedElevator;
            } else {
                await this.addPickupRequestToQueue(request.floor, request.direction);
                return null;
            }
        } catch (error) {
            if (error instanceof ElevatorNotFoundException || error instanceof InvalidFloorException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to handle pickup request');
        }
    }

    async addPickupRequestToQueue(floor: number, direction: number): Promise<void> {
        try {
            await this.elevatorRepository.addPickupRequest(floor, direction, PickupRequestStatus.Pending, null);
        } catch (error) {
            throw new InternalServerErrorException('Failed to add pickup request to queue');
        }
    }

    async updateElevator(elevator: Elevator): Promise<void> {
        try {
            await this.elevatorRepository.update(elevator);
            await this.processPendingRequests();
        } catch (error) {
            throw new InternalServerErrorException('Failed to update elevator');
        }
    }

    async handleUpdate(id: number, currentFloor: number, targetFloor: number, load: number): Promise<Elevator | undefined> {
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
                if (elevator.status !== ElevatorStatus.Moving || elevator.currentFloor === elevator.targetFloor) {
                    elevator.updateTarget(targetFloor);
                }
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
                    if (elevator.currentFloor === elevator.targetFloor) {
                        elevator.status = ElevatorStatus.Available;
                        await this.elevatorRepository.updatePickupRequestStatus(elevator.targetFloor!, elevator.targetFloor!, PickupRequestStatus.Done, elevator.id);
                        this.lastAvailableTime.set(elevator.id, Date.now());
                    }
                    await this.elevatorRepository.update(elevator);
                }
            }
            await this.processPendingRequests();
        } catch (error) {
            throw new InternalServerErrorException('Failed to perform step');
        }
    }

    async startMovement(broadcastUpdate: (status: any) => void): Promise<void> {
        const moveInterval = setInterval(async () => {
            await this.performStep();
            const elevators = await this.elevatorRepository.getAll();
            broadcastUpdate(elevators);
            const anyMoving = elevators.some(elevator => elevator.status === ElevatorStatus.Moving || elevator.targetFloor !== null);
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

    public findBestElevator(elevators: Elevator[], requestFloor: number): Elevator | null {
        const availableElevators = elevators.filter(elevator => 
            elevator.status === ElevatorStatus.Available && elevator.targetFloor === null);

        if (availableElevators.length === 0) {
            return null;
        }

        const scoredElevators = availableElevators.map(elevator => {
            const distance = Math.abs(elevator.currentFloor - requestFloor);
            const timeSinceAvailable = Date.now() - (this.lastAvailableTime.get(elevator.id) || 0);

            // Higher score for closer distance and more available time
            const score = distance + (timeSinceAvailable / 1000);
            return { elevator, score };
        });

        return scoredElevators.reduce((prev, curr) => prev.score < curr.score ? prev : curr).elevator;
    }

    public async processPendingRequests(): Promise<void> {
        const elevators = await this.elevatorRepository.getAll();
        const request = await this.elevatorRepository.getNextPendingRequest(); 
        if (request) {
            const availableElevator = this.findBestElevator(elevators, request.floor);
            if (availableElevator) {
                availableElevator.updateTarget(request.floor);
                availableElevator.status = ElevatorStatus.Moving;
                this.lastAvailableTime.set(availableElevator.id, Date.now());
                await this.elevatorRepository.update(availableElevator);
                await this.elevatorRepository.updatePickupRequestStatus(request.floor, request.direction, PickupRequestStatus.Processing, availableElevator.id);
            }
        }
    }
}
