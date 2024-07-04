export interface IEventPublisher {
    publishEvent(event: any): Promise<void>;
  }
  