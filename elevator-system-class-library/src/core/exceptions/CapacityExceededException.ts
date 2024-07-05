import { DomainException } from './DomainException';

export class CapacityExceededException extends DomainException {
    constructor(message: string = 'Elevator capacity exceeded') {
        super(message);
    }
}
