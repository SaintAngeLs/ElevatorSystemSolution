declare module 'elevator-system-class-library' {
    // Entities
    export enum ElevatorStatus {
        Available = 'Available',
        Moving = 'Moving',
        Unavailable = 'Unavailable',
    }

    export class Elevator {
      id: number;
      currentFloor: number;
      targetFloor: number | null;
      capacity: number;
      load: number;
      status: ElevatorStatus;

      constructor(
          id: number,
          currentFloor: number,
          capacity: number,
          targetFloor?: number | null,
          load?: number,
          status?: ElevatorStatus
      );

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
        addElevator(elevator: Elevator): Promise<void>;
        getAll(): Promise<Elevator[]>;
        getById(id: number): Promise<Elevator | undefined>;
        update(elevator: Elevator): Promise<void>;
        updateAll(elevators: Elevator[]): Promise<void>;
        deleteElevator(id: number): Promise<void>;
    }
  
    export class ElevatorRepository implements IElevatorRepository {
      private elevators: Elevator[];
  
      constructor();
  
      addElevator(elevator: Elevator): Promise<void>;
      getAll(): Promise<Elevator[]>;
      getById(id: number): Promise<Elevator | undefined>;
      update(elevator: Elevator): Promise<void>;
      updateAll(elevators: Elevator[]): Promise<void>;
      deleteElevator(id: number): Promise<void>;
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
        startMovement(): Promise<void>;
        getStatus(): Promise<Elevator[]>;
        updateElevator(elevator: Elevator): Promise<void>
        findNearestElevator(elevators: Elevator[], floor: number): Elevator;
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
