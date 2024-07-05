import { ICommand } from "../interfaces/ICommand";
import logger from '../logger';

export class PickupRequestCommand implements ICommand {
  constructor(public readonly floor: number, public readonly direction: number) {}

  execute(): void {
    logger.info(`Pickup request for floor: ${this.floor}, direction: ${this.direction}`);
  }
}