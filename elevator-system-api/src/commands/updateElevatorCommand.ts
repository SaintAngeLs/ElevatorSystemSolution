import { ICommand } from '../interfaces/ICommand';
import logger from '../logger';

export class UpdateElevatorCommand implements ICommand {
  constructor(
    public readonly id: number,
    public readonly currentFloor: number,
    public readonly targetFloor: number,
    public readonly load: number
  ) {}

  execute() {
    logger.info(`Updating elevator with ID: ${this.id}, 
      Current Floor: ${this.currentFloor}, 
      Target Floor: ${this.targetFloor}, Load: ${this.load}`);
  }
}