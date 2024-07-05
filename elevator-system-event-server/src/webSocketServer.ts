import WebSocket, { WebSocketServer } from 'ws';
import { config } from './config';
import { IWebSocketServer } from './interfaces/IWebSocketServer';
import { ElevatorService } from 'elevator-system-class-library';
import logger from './logger';
import { InternalServerErrorException } from './exceptions/InternalServerErrorException';

export class ElevatorWebSocketServer implements IWebSocketServer {
  private clients: WebSocket[] = [];
  private elevatorService: ElevatorService;

  constructor(elevatorService: ElevatorService) {
    this.elevatorService = elevatorService;
  }

  start(): void {
    const wss = new WebSocketServer({ port: config.webSocketPort });

    wss.on('connection', async (ws) => {
      this.clients.push(ws);
      logger.info('Client connected');

      ws.on('message', (message) => {
        logger.info('Received:', message);
      });

      ws.on('close', () => {
        const index = this.clients.indexOf(ws);
        if (index !== -1) {
          this.clients.splice(index, 1);
          logger.info('Client disconnected');
        }
      });

      try {
        const status = await this.elevatorService.getStatus();
        ws.send(JSON.stringify(status));
      } catch (error) {
        logger.error('Error fetching elevator status:', error);
        throw new InternalServerErrorException('Failed to fetch elevator status');
      }
    });

    logger.info(`WebSocket server running on ws://localhost:${config.webSocketPort}`);
  }

  broadcastUpdate(update: any): void {
    const message = JSON.stringify(update);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }
}
