"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestCompletedEvent = void 0;
class RequestCompletedEvent {
    constructor(payload) {
        this.payload = payload;
        this.type = 'REQUEST_COMPLETED';
    }
}
exports.RequestCompletedEvent = RequestCompletedEvent;
