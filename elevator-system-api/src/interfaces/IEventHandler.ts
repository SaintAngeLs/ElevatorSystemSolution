export interface IEventHandler {
    handleEvent(event: any): Promise<void>;
  }
  