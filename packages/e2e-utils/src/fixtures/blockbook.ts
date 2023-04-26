export const blockbook = {
    getInfo: {
        data: {
            name: 'TestMock',
            shortcut: 'test',
            decimals: 9,
            bestHeight: 1,
        },
    },
    getBlockHash: {
        data: {
            hash: '00000000839a8e6886ab5951d76f411475428afc90947ee320161bbf18eb6048',
        },
    },
    subscribeNewBlock: {
        data: { subscribed: true },
    },
    unsubscribeNewBlock: {
        data: { subscribed: false },
    },
    subscribeAddresses: {
        data: { subscribed: true },
    },
    unsubscribeAddresses: {
        data: { subscribed: false },
    },
    subscribeFiatRates: {
        data: { subscribed: true },
    },
    unsubscribeFiatRates: {
        data: { subscribed: false },
    },
    getAccountInfo: {
        data: {
            address: '0',
            balance: '0',
            txs: 0,
            unconfirmedBalance: 0,
            unconfirmedTxs: 0,
            nonce: '0',
            totalReceived: '0',
            totalSent: '0',
            usedTokens: 0,
        },
    },
    getAccountUtxo: {
        data: [],
    },
    sendTransaction: {
        data: {
            error: {
                message: '-22: TX decode failed',
            },
        },
    },
    estimateFee: {
        data: [],
    },
    getTransaction: {
        data: {
            error: {
                message: 'Transaction not found',
            },
        },
    },
    getCurrentFiatRates: {
        data: [],
    },
    getFiatRatesForTimestamps: {
        data: { tickers: [] },
    },
    getBalanceHistory: {
        data: [],
    },
};
