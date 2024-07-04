import { ICommandHandler } from '../interfaces/ICommandHandler';
import { CreateElevatorCommand } from '../commands/createElevatorCommand';
import { ElevatorService } from 'elevator-system-class-library';

export class CreateElevatorHandler implements ICommandHandler<CreateElevatorCommand> {
    constructor(private elevatorService: ElevatorService) {}

    handle(command: CreateElevatorCommand) {
        this.elevatorService.addElevator(command.id, command.initialFloor, command.capacity);
    }
}
