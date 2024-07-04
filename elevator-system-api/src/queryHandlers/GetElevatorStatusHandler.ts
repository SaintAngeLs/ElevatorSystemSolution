
import { IQueryHandler } from '../interfaces/IQueryHandler';
import { GetElevatorStatusQuery } from '../queries/GetElevatorStatusQuery';
import { ElevatorService } from 'elevator-system-class-library';

export class GetElevatorStatusHandler implements IQueryHandler<GetElevatorStatusQuery> {
    constructor(private elevatorService: ElevatorService) {}

    async handle(query: GetElevatorStatusQuery) {
        return this.elevatorService.getStatus();
    }
}
