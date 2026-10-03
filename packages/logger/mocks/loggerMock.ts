import type { CreateLogger, Logger } from '../src';

export const loggerMock: Logger = {
    log: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
};

export const createLoggerMock: CreateLogger = () => loggerMock;
