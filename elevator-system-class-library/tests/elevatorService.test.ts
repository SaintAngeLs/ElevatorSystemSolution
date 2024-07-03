import { ElevatorService } from '../src/elevatorSystem';
import { InMemoryElevatorRepository } from '../src/elevatorSystem';
import { ElevatorRequest } from '../src/elevatorSystem';

describe('ElevatorService', () => {
    let elevatorService: ElevatorService;
    let repository: InMemoryElevatorRepository;

    beforeEach(() => {
        repository = new InMemoryElevatorRepository();
        elevatorService = new ElevatorService(repository);
    });

    it('should add a new elevator', () => {
        const elevator = elevatorService.addElevator(5, 0, 10);
        const status = elevatorService.getStatus();
        expect(status.length).toBe(1);
        expect(status[0].id).toBe(5);
        expect(status[0].capacity).toBe(10);
    });

    it('should handle pickup request', () => {
        elevatorService.addElevator(1, 0, 10);
        const request = new ElevatorRequest(3, 1);
        const elevator = elevatorService.handlePickupRequest(request);
        expect(elevator.targetFloor).toBe(3);
    });

    it('should update elevator status', () => {
        elevatorService.addElevator(1, 0, 10);
        const elevator = elevatorService.handleUpdate(1, 3, 5, 2);
        const status = elevatorService.getStatus();
        expect(status[0].currentFloor).toBe(3);
        expect(status[0].targetFloor).toBe(5);
        expect(status[0].load).toBe(2);
    });

    it('should perform step', () => {
        elevatorService.addElevator(1, 0, 10);
        elevatorService.handlePickupRequest(new ElevatorRequest(3, 1));
        elevatorService.performStep();
        const status = elevatorService.getStatus();
        expect(status[0].currentFloor).toBe(1);
    });

    it('should not exceed elevator capacity', () => {
        elevatorService.addElevator(1, 0, 5);
        const elevator = repository.getById(1);
        expect(elevator?.addLoad(5)).toBe(true);
        expect(elevator?.addLoad(6)).toBe(false);
    });

    it('should remove load from elevator', () => {
        elevatorService.addElevator(1, 0, 10);
        const elevator = repository.getById(1);
        elevator?.addLoad(5);
        expect(elevator?.removeLoad(3)).toBe(true);
        expect(elevator?.load).toBe(2);
    });
});
