import { EventEmitter } from 'events';

export const mockCoinjoinService = () => {
    const allowed = ['btc', 'test'];
    const clients: Record<string, any> = {}; // @trezor/coinjoin CoinjoinClient
    const clientEmitter = new EventEmitter();
    clientEmitter.setMaxListeners(Infinity);

    const getMockedInstance = (network: string) => {
        const client = {
            settings: { coordinatorName: '', network },
            on: jest.fn((...args: Parameters<typeof clientEmitter.on>) => {
                clientEmitter.on(...args);
            }),
            off: jest.fn((...args: Parameters<typeof clientEmitter.off>) => {
                clientEmitter.off(...args);
            }),
            emit: jest.fn((eventName: string, ...args: any[]) => {
                clientEmitter.emit(eventName, ...args);
            }),
            enable: jest.fn(() =>
                Promise.resolve({
                    success: true,
                    rounds: [{ id: '00', phase: 0 }],
                    feeRateMedian: 0,
                    coordinatorFeeRate: 0.003,
                    allowedInputAmounts: { min: 5000, max: 134375000000 },
                }),
            ),
            registerAccount: jest.fn(),
            unregisterAccount: jest.fn(),
            updateAccount: jest.fn(),
            resolveRequest: jest.fn(),
            analyzeTransactions: jest.fn(() => ({ anonymityScores: {}, rawLiquidityClue: 0 })),
        };
        const backend = {
            on: jest.fn(),
            off: jest.fn(),
            cancel: jest.fn(),
            scanAccount: jest.fn(() => ({
                pending: [],
                checkpoint: {
                    receiveCount: 20,
                    changeCount: 20,
                },
            })),
            getAccountInfo: jest.fn(() => ({
                history: {
                    transactions: [],
                },
                addresses: {
                    used: [],
                    unused: [],
                    change: [],
                },
            })),
            getAccountCheckpoint: jest.fn(() => undefined),
        };

        return { client, backend };
    };

    return {
        // for test purposes enable only btc network
        CoinjoinService: {
            getInstance: jest.fn((symbol: string) => clients[symbol]),
            getInstances: jest.fn(() => Object.values(clients)),
            createInstance: jest.fn(({ network }: { network: string }) => {
                if (!allowed.includes(network)) throw new Error('Client not supported');
                if (clients[network]) return clients[network];
                const instance = getMockedInstance(network);
                clients[network] = instance;

                return instance;
            }),
            removeInstance: jest.fn((symbol: string) => {
                delete clients[symbol];
            }),
        },
    };
};
