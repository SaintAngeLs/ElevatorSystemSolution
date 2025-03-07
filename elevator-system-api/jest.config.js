/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/tests/**/*.test.ts'],
  verbose: true,
  collectCoverage: true,
  setupFiles: ['<rootDir>/src/mocks/amqplib.ts'],
};
