export interface ElevatorDTO {
    id: number;
    currentFloor: number;
    targetFloor: number | null;
    capacity: number;
    load: number;
}
