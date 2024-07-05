import { Elevator } from '../entities/Elevator';
import { PickupRequestStatus } from '../entities/PickupRequestStatus';

export interface IElevatorRepository {
    getAll(): Promise<Elevator[]>;
    getById(id: number): Promise<Elevator | undefined>;
    update(elevator: Elevator): Promise<void>;
    updateAll(elevators: Elevator[]): Promise<void>;
    addElevator(elevator: Elevator): Promise<void>;
    deleteElevator(id: number): Promise<void>;
    addPickupRequest(floor: number, direction: number, status: PickupRequestStatus, elevatorId: number | null): Promise<void>;
    getNextPendingRequest(): Promise<{ floor: number, direction: number, status: PickupRequestStatus, elevatorId: number | null } | null>;
    updatePickupRequestStatus(floor: number, direction: number, newStatus: PickupRequestStatus, elevatorId: number | null): Promise<void>;
}
