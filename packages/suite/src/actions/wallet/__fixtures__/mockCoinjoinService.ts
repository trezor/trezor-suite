export const mockCoinjoinService = () => {
    const allowed = ['btc', 'test'];
    const clients: Record<string, any> = {}; // @trezor/coinjoin CoinjoinClient
    const getMockedInstance = (network: string) => {
        const client = {
            settings: { coordinatorName: '', network },
            on: jest.fn(),
            off: jest.fn(),
            emit: jest.fn(),
            enable: jest.fn(() =>
                Promise.resolve({
                    rounds: [{ id: '00', phase: 0 }],
                    feeRateMedian: 0,
                    coordinatorFeeRate: 0.003,
                    allowedInputAmounts: { min: 5000, max: 134375000000 },
                }),
            ),
            registerAccount: jest.fn(),
            unregisterAccount: jest.fn(),
            updateAccount: jest.fn(),
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
        };
        return { client, backend };
    };

    return {
        // for test purposes enable only btc network
        CoinjoinService: {
            getInstance: jest.fn((symbol: string) => clients[symbol]),
            getInstances: jest.fn(() => Object.values(clients)),
            createInstance: jest.fn((symbol: string) => {
                if (!allowed.includes(symbol)) throw new Error('Client not supported');
                if (clients[symbol]) return clients[symbol];
                const instance = getMockedInstance(symbol);
                clients[symbol] = instance;
                return instance;
            }),
            removeInstance: jest.fn((symbol: string) => {
                delete clients[symbol];
            }),
        },
    };
};
