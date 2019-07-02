/* eslint-disable global-require */
// mocked blockbook responses

export default {
    getInfo: {
        data: {
            name: 'Test',
            shortcut: 'test',
            decimals: 9,
            bestHeight: 1,
        },
    },
    // getAccountInfo: require('./getAccountInfo'),
    // subscribe: require('./estimateFee'),

    subscribeNewBlock: {
        data: {
            subscribed: true,
        },
    },
    unsubscribeNewBlock: {
        data: {
            subscribed: false,
        },
    },
    subscribeAddresses: {
        data: {
            subscribed: true,
        },
    },
    unsubscribeAddresses: {
        data: {
            subscribed: false,
        },
    },

    getAccountInfo: {
        data: {
            address: '0',
            balance: '0',
            txs: 0,
            unconfirmedBalance: 0,
            unconfirmedTxs: 0,
            // eth stuff
            nonce: '0',
            // btc stuff
            totalReceived: '0',
            totalSent: '0',
            usedTokens: 0, // how many adresses are used
        },
    },

    getAccountUtxo: {
        data: [],
    },
};
