import { IEvent } from '../interfaces/IEvent';

export class ElevatorUpdatedEvent implements IEvent {
    type = 'ELEVATOR_UPDATED';

    constructor(public payload: { id: number; 
        currentFloor: number; 
        targetFloor: number; 
        load: number }) {}
}
