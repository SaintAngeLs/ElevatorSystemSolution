declare module 'elevator-system-class-library' {
    // Entities
    export class Elevator {
      constructor(
        id: number,
        currentFloor: number,
        capacity: number,
        targetFloor?: number | null,
        load?: number
      );
  
      id: number;
      currentFloor: number;
      targetFloor: number | null;
      capacity: number;
      load: number;
  
      move(): void;
      updateTarget(targetFloor: number): void;
      addLoad(amount: number): boolean;
      removeLoad(amount: number): boolean;
    }
  
    export class ElevatorRequest {
      constructor(floor: number, direction: number);
      floor: number;
      direction: number;
    }
  
    // Repositories
    export interface IElevatorRepository {
      getAll(): Elevator[];
      getById(id: number): Elevator | undefined;
      update(elevator: Elevator): void;
      updateAll(elevators: Elevator[]): void;
      addElevator(elevator: Elevator): void;
    }
  
    export class InMemoryElevatorRepository implements IElevatorRepository {
      private elevators: Elevator[];
  
      constructor();
  
      addElevator(elevator: Elevator): void;
      getAll(): Elevator[];
      getById(id: number): Elevator | undefined;
      update(elevator: Elevator): void;
      updateAll(elevators: Elevator[]): void;
    }
  
    // Services
    export class ElevatorService {
      constructor(elevatorRepository: IElevatorRepository);
  
      addElevator(id: number, initialFloor: number, capacity: number): Elevator;
      handlePickupRequest(request: ElevatorRequest): Elevator;
      handleUpdate(
        id: number,
        currentFloor: number,
        targetFloor: number,
        load: number
      ): Elevator | undefined;
      performStep(): void;
      getStatus(): Elevator[];
    }
  
    // DTOs
    export interface ElevatorDTO {
      id: number;
      currentFloor: number;
      targetFloor: number | null;
      capacity: number;
      load: number;
    }
  
    // Mappers
    export class ElevatorMapper {
      static toDTO(elevator: Elevator): ElevatorDTO;
      static toDomain(dto: ElevatorDTO): Elevator;
    }
  }
  