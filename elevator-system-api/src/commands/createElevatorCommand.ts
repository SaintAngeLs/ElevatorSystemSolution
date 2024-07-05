import { ICommand } from '../interfaces/ICommand';

export class CreateElevatorCommand implements ICommand {
    constructor(
        public readonly id: number,
        public readonly initialFloor: number,
        public readonly capacity: number
    ) {}

    execute() {
        console.log(`Creating elevator with ID: ${this.id}, Floor: ${this.initialFloor}, Capacity: ${this.capacity}`);
    }
}
