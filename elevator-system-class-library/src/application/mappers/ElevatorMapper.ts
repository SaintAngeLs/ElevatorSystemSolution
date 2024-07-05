import { Elevator } from '../../core/entities/Elevator';
import { ElevatorDTO } from '../dtos/ElevatorDTO';

export class ElevatorMapper {
    static toDTO(elevator: Elevator): ElevatorDTO {
        return {
            id: elevator.id,
            currentFloor: elevator.currentFloor,
            targetFloor: elevator.targetFloor,
            capacity: elevator.capacity,
            load: elevator.load
        };
    }

    static toDomain(dto: ElevatorDTO): Elevator {
        return new Elevator(dto.id, dto.currentFloor, 
            dto.capacity, dto.targetFloor ?? undefined, dto.load);
    }
}
