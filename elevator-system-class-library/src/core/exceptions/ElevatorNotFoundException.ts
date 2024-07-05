import { DomainException } from './DomainException';

export class ElevatorNotFoundException extends DomainException {
    constructor(id: number) {
        super(`Elevator with ID ${id} not found`);
    }
}
