import UDP from 'dgram';
import { UdpApi } from '../src/api/udp';

// mock dgram api
jest.mock('dgram', () => {
    return {
        __esModule: true,
        default: {
            createSocket: jest.fn(() => {
                throw new Error('use mockImplementation');
            }),
        },
    };
});

// mock of UDP.Socket
const createUdpSocketMock = (optional = {}) =>
    ({
        send: (...args: any[]) => args[3](),
        addListener: () => {},
        removeListener: () => {},
        ...optional,
    }) as unknown as UDP.Socket;

describe('api/udp', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('read aborted', async () => {
        jest.spyOn(UDP, 'createSocket').mockImplementation(() => createUdpSocketMock());

        const api = new UdpApi({});

        const abortController = new AbortController();
        await api.enumerate(abortController.signal);
        const promise = api.read('1', abortController.signal);
        abortController.abort();

        const result = await promise;
        if (result.success) throw new Error('Unexpected success');
        expect(result.error).toContain('Aborted by signal');
    });

    it('write aborted', async () => {
        let listeners = 0;

        jest.spyOn(UDP, 'createSocket').mockImplementation(() =>
            createUdpSocketMock({
                send: (...args: any[]) => {
                    setTimeout(() => args[3](), 200);
                },
                addListener: () => {
                    listeners++;
                },
                removeListener: () => {
                    listeners--;
                },
            }),
        );

        const api = new UdpApi({});

        const abortController = new AbortController();
        await api.enumerate(abortController.signal);
        const promise = api.write('1', Buffer.alloc(api.chunkSize), abortController.signal);
        abortController.abort();

        const result = await promise;
        if (result.success) throw new Error('Unexpected success');
        expect(result.error).toContain('Aborted by signal');
        expect(listeners).toBe(0);
    });

    it('enumerate aborted', async () => {
        jest.spyOn(UDP, 'createSocket').mockImplementation(() =>
            createUdpSocketMock({
                send: (...args: any[]) => {
                    setTimeout(() => args[3](), 100);
                },
            }),
        );

        const api = new UdpApi({});

        const abortController = new AbortController();
        const promise = api.enumerate(abortController.signal);
        abortController.abort();

        const result = await promise;
        if (result.success) throw new Error('Unexpected success');
        expect(result.error).toContain('Aborted by signal');
    });
});
