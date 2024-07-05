export interface IConsumer {
    start(): Promise<void>;
    handleEvent(event: any, msg: any): Promise<void>;
}
