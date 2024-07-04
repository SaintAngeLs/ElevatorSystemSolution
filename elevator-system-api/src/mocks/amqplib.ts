import amqp from 'amqplib';
jest.mock('amqplib');

const assertQueue = jest.fn();
const sendToQueue = jest.fn();
const consume = jest.fn();

const channelMock = {
  assertQueue,
  sendToQueue,
  consume
};

const createChannel = jest.fn().mockResolvedValue(channelMock);

const connect = jest.fn().mockResolvedValue({
  createChannel
});

amqp.connect = connect;
