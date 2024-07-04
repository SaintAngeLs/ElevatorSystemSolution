import { CreateElevatorCommand } from '../commands/createElevatorCommand';
import { ICommandHandler } from '../interfaces/ICommandHandler';
import { ElevatorService } from 'elevator-system-class-library';

export class CreateElevatorHandler implements ICommandHandler<CreateElevatorCommand> {
  constructor(private elevatorService: ElevatorService) {}

  async handle(command: CreateElevatorCommand) {
    await this.elevatorService.addElevator(command.id, command.initialFloor, command.capacity);
  }
}
