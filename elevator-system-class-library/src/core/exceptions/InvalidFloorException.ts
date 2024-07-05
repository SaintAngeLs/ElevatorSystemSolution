import { DomainException } from './DomainException';

export class InvalidFloorException extends DomainException {
    constructor(message: string = 'Invalid floor request') {
        super(message);
    }
}
