import { getSuiteSyncRelayConnectionFromEvoluLog } from '../relayConnectionStatus';

describe(getSuiteSyncRelayConnectionFromEvoluLog.name, () => {
    beforeEach(() => {
        jest.spyOn(Date, 'now').mockReturnValue(123);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('parses websocket connection status', () => {
        expect(
            getSuiteSyncRelayConnectionFromEvoluLog({
                method: 'info',
                args: [
                    'webSocketOpen',
                    {
                        url: 'http://suite-sync.example.onion/evolu/?ownerId=1',
                    },
                ],
            }),
        ).toEqual([
            {
                type: 'status',
                connection: {
                    state: 'connected',
                    timestamp: 123,
                    url: 'http://suite-sync.example.onion/evolu/',
                },
            },
        ]);
    });

    it('parses websocket creation as add event and disconnected status', () => {
        expect(
            getSuiteSyncRelayConnectionFromEvoluLog({
                method: 'info',
                args: [
                    'webSocketCreated',
                    {
                        url: 'http://127.0.0.1:4000/evolu/?ownerId=1',
                    },
                ],
            }),
        ).toEqual([
            {
                type: 'add',
                url: 'http://127.0.0.1:4000/evolu/',
            },
            {
                type: 'status',
                connection: {
                    state: 'disconnected',
                    timestamp: 123,
                    url: 'http://127.0.0.1:4000/evolu/',
                },
            },
        ]);
    });

    it('parses websocket close only as disconnected status', () => {
        expect(
            getSuiteSyncRelayConnectionFromEvoluLog({
                method: 'info',
                args: [
                    'webSocketClose',
                    {
                        url: 'http://127.0.0.1:4000/evolu/?ownerId=1',
                    },
                ],
            }),
        ).toEqual([
            {
                type: 'status',
                connection: {
                    state: 'disconnected',
                    timestamp: 123,
                    url: 'http://127.0.0.1:4000/evolu/',
                },
            },
        ]);
    });

    it('parses owner add as relay connection add event', () => {
        expect(
            getSuiteSyncRelayConnectionFromEvoluLog({
                method: 'debug',
                args: [
                    'useOwner',
                    {
                        action: 'add',
                        transportUrls: [
                            'http://suite-sync.example.onion/evolu/?ownerId=1',
                            'https://suite-sync.trezor.io/evolu/?ownerId=1',
                        ],
                    },
                ],
            }),
        ).toEqual([
            {
                type: 'add',
                url: 'http://suite-sync.example.onion/evolu/',
            },
            {
                type: 'add',
                url: 'https://suite-sync.trezor.io/evolu/',
            },
        ]);
    });

    it('parses owner removal as relay connection remove event', () => {
        expect(
            getSuiteSyncRelayConnectionFromEvoluLog({
                method: 'debug',
                args: [
                    'useOwner',
                    {
                        action: 'remove',
                        transportUrls: [
                            'http://suite-sync.example.onion/evolu/?ownerId=1',
                            'https://suite-sync.trezor.io/evolu/?ownerId=1',
                        ],
                    },
                ],
            }),
        ).toEqual([
            {
                type: 'remove',
                url: 'http://suite-sync.example.onion/evolu/',
            },
            {
                type: 'remove',
                url: 'https://suite-sync.trezor.io/evolu/',
            },
        ]);
    });

    it('parses owner removal when message is in console entry path', () => {
        expect(
            getSuiteSyncRelayConnectionFromEvoluLog({
                method: 'debug',
                path: ['SharedWorker', 'useOwner', 'tenant'],
                args: [
                    {
                        action: 'remove',
                        transportUrls: ['http://127.0.0.1:4000/evolu/?ownerId=1'],
                    },
                ],
            }),
        ).toEqual([
            {
                type: 'remove',
                url: 'http://127.0.0.1:4000/evolu/',
            },
        ]);
    });
});
