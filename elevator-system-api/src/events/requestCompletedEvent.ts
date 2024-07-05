import { IEvent } from "../interfaces/IEvent";

export class RequestCompletedEvent implements IEvent {
    type = 'REQUEST_COMPLETED';

    constructor(public payload: { elevatorId: number; floor: number; direction: number }) {}
}