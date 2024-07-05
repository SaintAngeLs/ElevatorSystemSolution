import { IEvent } from '../interfaces/IEvent';

export class PickupRequestEvent implements IEvent {
    type = 'PICKUP_REQUEST';

    constructor(public payload: { floor: number; direction: number }) {}
}
