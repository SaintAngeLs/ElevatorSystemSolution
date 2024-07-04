import { ElevatorRequest, ElevatorService } from 'elevator-system-class-library';
import { IEventHandler } from '../interfaces/IEventHandler';
import { PickupRequestEvent } from '../events/pickupRequestEvent';

export class PickupRequestEventHandler implements IEventHandler<PickupRequestEvent> {
  constructor(private readonly elevatorService: ElevatorService) {}

  async handle(event: PickupRequestEvent): Promise<void> {
    const { floor, direction } = event.payload;
    const request = new ElevatorRequest(floor, direction);
    await this.elevatorService.handlePickupRequest(request);
  }
}
