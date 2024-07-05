export interface IWebSocketServer {
    start(): void;
    broadcastUpdate(status: any): void;
}
