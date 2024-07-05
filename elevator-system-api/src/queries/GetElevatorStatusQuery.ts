import { IQuery } from '../interfaces/IQuery';

export class GetElevatorStatusQuery implements IQuery {
    constructor(public readonly id: number) {}
}
