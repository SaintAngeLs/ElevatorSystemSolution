import { IEvent } from '../interfaces/IEvent';

export class ElevatorCreatedEvent implements IEvent {
    type = 'ELEVATOR_CREATED';

    constructor(public payload: { id: number; initialFloor: number; capacity: number }) {}
}
