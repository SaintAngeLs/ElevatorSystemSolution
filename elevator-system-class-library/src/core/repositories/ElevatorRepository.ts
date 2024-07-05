import { Elevator } from '../entities/Elevator';
import { PickupRequestStatus } from '../entities/PickupRequestStatus';
import { IElevatorRepository } from './IElevatorRepository';

export class ElevatorRepository implements IElevatorRepository {
    private elevators: Elevator[] = [];
    private pickupRequests: { floor: number, direction: number, status: PickupRequestStatus, elevatorId: number | null }[] = [];

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

    async deleteElevator(id: number): Promise<void> {
        this.elevators = this.elevators.filter(elevator => elevator.id !== id);
    }

    async addPickupRequest(floor: number, direction: number, status: PickupRequestStatus, elevatorId: number | null): Promise<void> {
        this.pickupRequests.push({ floor, direction, status, elevatorId });
    }

    async getNextPendingRequest(): Promise<{ floor: number, direction: number, status: PickupRequestStatus, elevatorId: number | null } | null> {
        const pendingRequest = this.pickupRequests.find(req => req.status === PickupRequestStatus.Pending);
        return pendingRequest || null;
    }

    async updatePickupRequestStatus(floor: number, direction: number, newStatus: PickupRequestStatus, elevatorId: number | null): Promise<void> {
        const index = this.pickupRequests.findIndex(req => req.floor === floor && req.direction === direction);
        if (index !== -1) {
            this.pickupRequests[index].status = newStatus;
            this.pickupRequests[index].elevatorId = elevatorId;
        }
    }
}
