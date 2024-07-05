import { ICommand } from '../interfaces/ICommand';

export class UpdateElevatorCommand implements ICommand {
    constructor(
        public readonly id: number,
        public readonly currentFloor: number,
        public readonly targetFloor: number,
        public readonly load: number
    ) {}

    execute() {
        console.log(`Updating elevator with ID: ${this.id}, 
        Current Floor: ${this.currentFloor}, 
        Target Floor: ${this.targetFloor}, Load: ${this.load}`);
    }
}
