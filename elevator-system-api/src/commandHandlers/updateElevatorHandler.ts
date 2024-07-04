import { ICommandHandler } from '../interfaces/ICommandHandler';
import { UpdateElevatorCommand } from '../commands/updateElevatorCommand';
import { ElevatorService } from 'elevator-system-class-library';

export class UpdateElevatorHandler implements ICommandHandler<UpdateElevatorCommand> {
    constructor(private elevatorService: ElevatorService) {}

    handle(command: UpdateElevatorCommand) {
        this.elevatorService.handleUpdate(command.id, 
            command.currentFloor, command.targetFloor, 
            command.load);
    }
}
