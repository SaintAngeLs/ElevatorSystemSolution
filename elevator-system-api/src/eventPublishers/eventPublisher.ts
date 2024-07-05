import { IEventPublisher } from "../interfaces/IEventPublisher";

export class RabbitMQEventPublisher implements IEventPublisher {
  constructor(private channel: any) {}

  async publishEvent(event: any): Promise<void> {
    this.channel.sendToQueue('elevator_events', Buffer.from(JSON.stringify(event)));
  }
}
