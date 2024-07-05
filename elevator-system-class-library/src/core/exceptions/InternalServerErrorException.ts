import { BaseException } from './BaseException';

export class InternalServerErrorException extends BaseException {
    constructor(message: string) {
        super(message, 500);
    }
}
