import { ElevatorStatus } from "./ElevatorStatus";

export class Elevator {
    constructor(
        public readonly id: number,
        public currentFloor: number,
        public capacity: number,
        public targetFloor: number | null = null,
        public load: number = 0,
        public status: ElevatorStatus = ElevatorStatus.Available
    ) {}

    move() {
        if (this.targetFloor !== null) {
            this.status = ElevatorStatus.Moving;
            if (this.currentFloor < this.targetFloor) {
                this.currentFloor++;
            } else if (this.currentFloor > this.targetFloor) {
                this.currentFloor--;
            }

            if (this.currentFloor === this.targetFloor) {
                this.targetFloor = null;
                this.status = ElevatorStatus.Available;
            }
        }
    }

    updateTarget(targetFloor: number) {
        this.targetFloor = targetFloor;
        this.status = ElevatorStatus.Moving;
    }

    addLoad(amount: number): boolean {
        if (this.load + amount <= this.capacity) {
            this.load += amount;
            return true;
        }
        return false;
    }

    removeLoad(amount: number): boolean {
        if (this.load - amount >= 0) {
            this.load -= amount;
            return true;
        }
        return false;
    }
}
