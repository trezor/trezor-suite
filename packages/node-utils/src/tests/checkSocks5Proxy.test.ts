import net from 'net';

import { checkSocks5Proxy } from '../checkSocks5Proxy';

jest.mock('net');

describe('checkSocks5Proxy', () => {
    const host = '127.0.0.1';
    const port = 9050;

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return true for a valid SOCKS5 proxy', async () => {
        const mockSocket = {
            connect: jest.fn(),
            write: jest.fn(),
            on: jest.fn((event, callback) => {
                if (event === 'connect') {
                    callback();
                }
                if (event === 'data') {
                    // Valid SOCKS5 response.
                    callback(Buffer.from([0x05, 0x00]));
                }
            }),
            setTimeout: jest.fn(),
            destroy: jest.fn(),
        };

        // @ts-expect-error
        net.Socket.mockImplementation(() => mockSocket);

        const result = await checkSocks5Proxy(host, port);
        expect(result).toBe(true);
    });

    it('should return false for an invalid SOCKS5 proxy', async () => {
        const mockSocket = {
            connect: jest.fn(),
            write: jest.fn(),
            on: jest.fn((event, callback) => {
                if (event === 'connect') {
                    callback();
                }
                if (event === 'data') {
                    // Not valid SOCKS5 response
                    callback(Buffer.from([0x05, 0x01]));
                }
            }),
            setTimeout: jest.fn(),
            destroy: jest.fn(),
        };

        // @ts-expect-error
        net.Socket.mockImplementation(() => mockSocket);

        const result = await checkSocks5Proxy(host, port);
        expect(result).toBe(false);
    });
});
