import { IQueryHandler } from '../interfaces/IQueryHandler';
import { GetAllElevatorsQuery } from '../queries/GetAllElevatorsQuery';
import { ElevatorService } from 'elevator-system-class-library';

export class GetAllElevatorsHandler implements IQueryHandler<GetAllElevatorsQuery> {
    constructor(private elevatorService: ElevatorService) {}

    async handle(query: GetAllElevatorsQuery) {
        return await this.elevatorService.getStatus();
    }
}