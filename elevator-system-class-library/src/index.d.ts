declare module 'elevator-system-class-library' {
    // Entities
    export enum ElevatorStatus {
        Available = 'Available',
        Moving = 'Moving',
        Unavailable = 'Unavailable',
    }

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
      getAll(): Promise<Elevator[]>;
      getById(id: number): Promise<Elevator | undefined>;
      update(elevator: Elevator): Promise<void>;
      updateAll(elevators: Elevator[]): Promise<void>;
      addElevator(elevator: Elevator): Promise<void>;
    }
  
    export class ElevatorRepository implements IElevatorRepository {
      private elevators: Elevator[];
  
      constructor();
  
      addElevator(elevator: Elevator): Promise<void>;
      getAll(): Promise<Elevator[]>;
      getById(id: number): Promise<Elevator | undefined>;
      update(elevator: Elevator): Promise<void>;
      updateAll(elevators: Elevator[]): Promise<void>;
    }
  
    // Services
    export class ElevatorService {
      constructor(elevatorRepository: IElevatorRepository);
  
      addElevator(id: number, initialFloor: number, capacity: number): Promise<Elevator>;
      handlePickupRequest(request: ElevatorRequest): Promise<Elevator>;
      handleUpdate(
        id: number,
        currentFloor: number,
        targetFloor: number,
        load: number
      ): Promise<Elevator | undefined>;
      performStep(): Promise<void>;
      getStatus(): Promise<Elevator[]>;
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
