export class Elevator {
    constructor(
        public readonly id: number,
        public currentFloor: number,
        public targetFloor: number | null = null,
        public capacity: number,
        public load: number = 0
    ) {}

    move() {
        if (this.targetFloor !== null) {
            if (this.currentFloor < this.targetFloor) {
                this.currentFloor++;
            } else if (this.currentFloor > this.targetFloor) {
                this.currentFloor--;
            }

            if (this.currentFloor === this.targetFloor) {
                this.targetFloor = null;
            }
        }
    }

    updateTarget(targetFloor: number) {
        this.targetFloor = targetFloor;
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
