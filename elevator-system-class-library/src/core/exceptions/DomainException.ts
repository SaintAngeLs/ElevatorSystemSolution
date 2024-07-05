import { BaseException } from './BaseException';

export class DomainException extends BaseException {
    constructor(message: string) {
        super(message, 400);
    }
}
