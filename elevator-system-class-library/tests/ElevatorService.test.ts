import { Elevator, ElevatorRequest, ElevatorService, IElevatorRepository } from "elevator-system-class-library";

describe('ElevatorService', () => {
  let elevatorRepository: jest.Mocked<IElevatorRepository>;
  let elevatorService: ElevatorService;

  beforeEach(() => {
    elevatorRepository = {
      addElevator: jest.fn().mockResolvedValue(undefined),
      getAll: jest.fn().mockResolvedValue([] as Elevator[]),
      getById: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      updateAll: jest.fn().mockResolvedValue(undefined),
    } as jest.Mocked<IElevatorRepository>;
    elevatorService = new ElevatorService(elevatorRepository);
  });

  it('should add an elevator', async () => {
    const elevator = new Elevator(1, 0, 10);
    elevatorRepository.addElevator.mockResolvedValueOnce(undefined);

    const result = await elevatorService.addElevator(1, 0, 10);

    expect(result).toEqual(elevator);
    expect(elevatorRepository.addElevator).toHaveBeenCalledWith(elevator);
  });

  it('should handle pickup request', async () => {
    const elevator = new Elevator(1, 0, 10);
    const request = new ElevatorRequest(5, 1);
    elevatorRepository.getAll.mockResolvedValueOnce([elevator]);
    elevatorRepository.update.mockResolvedValueOnce(undefined);

    const result = await elevatorService.handlePickupRequest(request);

    expect(result).toEqual(elevator);
    expect(elevatorRepository.update).toHaveBeenCalledWith(expect.objectContaining({ targetFloor: 5 }));
  });

  it('should handle update', async () => {
    const elevator = new Elevator(1, 0, 10);
    elevatorRepository.getById.mockResolvedValueOnce(elevator);
    elevatorRepository.update.mockResolvedValueOnce(undefined);

    const result = await elevatorService.handleUpdate(1, 1, 5, 3);

    expect(result).toEqual(expect.objectContaining({ id: 1, currentFloor: 1, targetFloor: 5, load: 3 }));
    expect(elevatorRepository.update).toHaveBeenCalledWith(expect.objectContaining({ id: 1, currentFloor: 1, targetFloor: 5, load: 3 }));
  });

  it('should perform step', async () => {
    const elevator = new Elevator(1, 0, 10);
    elevator.targetFloor = 2;
    elevator.currentFloor = 0;
    elevator.load = 0;

    elevatorRepository.getAll.mockResolvedValueOnce([elevator]);
    elevatorRepository.updateAll.mockResolvedValueOnce(undefined);

    await elevatorService.performStep();

    expect(elevator.currentFloor).toBe(1);
    expect(elevator.targetFloor).toBe(2);
    expect(elevatorRepository.updateAll).toHaveBeenCalledWith([elevator]);
  });

  it('should get status', async () => {
    const elevators = [new Elevator(1, 0, 10)];
    elevatorRepository.getAll.mockResolvedValueOnce(elevators);

    const result = await elevatorService.getStatus();

    expect(result).toEqual(elevators);
    expect(elevatorRepository.getAll).toHaveBeenCalled();
  });
});
