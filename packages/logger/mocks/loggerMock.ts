import type { CreateLogger, Logger } from '../src';

export const createLoggerMock: CreateLogger = jest
    .fn<ReturnType<CreateLogger>, Parameters<CreateLogger>>()
    .mockImplementation(() => ({
        log: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    }));

export const loggerMock: Logger = createLoggerMock('mock');
