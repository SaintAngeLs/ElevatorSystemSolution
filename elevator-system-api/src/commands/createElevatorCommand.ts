import { ICommand } from '../interfaces/ICommand';
import logger from '../logger';

export class CreateElevatorCommand implements ICommand {
  constructor(
    public readonly id: number,
    public readonly initialFloor: number,
    public readonly capacity: number
  ) {}

  execute() {
    logger.info(`Creating elevator with ID: ${this.id}, Floor: ${this.initialFloor}, Capacity: ${this.capacity}`);
  }
}