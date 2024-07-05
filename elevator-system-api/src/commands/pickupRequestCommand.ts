import { ICommand } from "../interfaces/ICommand";

export class PickupRequestCommand implements ICommand {
  constructor(public readonly floor: number, public readonly direction: number) {}

  execute(): void {
    console.log(`Pickup request for floor: ${this.floor}, direction: ${this.direction}`);
  }
}
