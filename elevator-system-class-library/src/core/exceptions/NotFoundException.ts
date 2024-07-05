import { BaseException } from './BaseException';

export class NotFoundException extends BaseException {
    constructor(message: string) {
        super(message, 404);
    }
}
