import request from 'supertest';
import express from 'express';
import { setupRoutes } from '../routes';
import { config } from '../config';
import amqp from 'amqplib';

jest.mock('amqplib');

describe('Elevator API', () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    await setupRoutes(app);
  });

  it('should create an elevator', async () => {
    const response = await request(app)
      .post('/elevator')
      .send({ id: 1, initialFloor: 0, capacity: 10 });

    expect(response.status).toBe(201);
    expect(response.text).toBe('Elevator created');
  });

  it('should update an elevator', async () => {
    const response = await request(app)
      .put('/elevator/1')
      .send({ currentFloor: 1, targetFloor: 5, load: 3 });

    expect(response.status).toBe(200);
    expect(response.text).toBe('Elevator updated');
  });
});
