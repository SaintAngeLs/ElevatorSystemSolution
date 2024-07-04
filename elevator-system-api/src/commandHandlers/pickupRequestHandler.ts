import { ElevatorRequest, ElevatorService } from 'elevator-system-class-library';
import { ICommandHandler } from '../interfaces/ICommandHandler';
import { PickupRequestCommand } from '../commands/pickupRequestCommand';

export class PickupRequestHandler implements ICommandHandler<PickupRequestCommand> {
  constructor(private readonly elevatorService: ElevatorService) {}

  async handle(command: PickupRequestCommand): Promise<void> {
    const { floor, direction } = command;
    const request = new ElevatorRequest(floor, direction);
    await this.elevatorService.handlePickupRequest(request);
    command.execute();
  }
}
