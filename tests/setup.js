/**
 * Test setup file
 */

// Mock WebSocket for testing
global.WebSocket = require('ws');

// Mock console methods to reduce noise in tests
const originalConsole = console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '0';
process.env.ENABLE_PRICE_MODIFIER = 'true';
process.env.PRICE_MULTIPLIER = '0.5';
