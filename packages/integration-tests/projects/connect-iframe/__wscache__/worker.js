import { MESSAGES, RESPONSES } from '@trezor/blockchain-link/lib/constants';

// Mock 'Worker' module to return blockchain-link responses from cache
// Jest implementation: see ./tests/jest.setup.js
// Karma implementation: see ./tests/karma.setup.js

class MockedWorker {
    constructor() {
        setTimeout(() => {
            this.post({ id: -1, type: MESSAGES.HANDSHAKE });
        }, 1);
    }

    post(data) {
        this.onmessage({ data });
    }

    postMessage(data) {
        if (data.type === MESSAGES.HANDSHAKE) {
            this.settings = data.settings;
        }
        if (data.type === MESSAGES.CONNECT) {
            this.post({ id: -1, type: RESPONSES.CONNECTED });
            this.post({ id: data.id, type: RESPONSES.CONNECT });
        }
        if (data.type === MESSAGES.GET_INFO) {
            this.post({
                id: data.id,
                type: RESPONSES.GET_INFO,
                payload: {
                    url: 'mocked-worker-url',
                    name: this.settings.name,
                    shortcut: this.settings.name,
                    testnet: true,
                    version: '0.0.0-mocked',
                    decimals: 8,
                    blockHeight: 7000000, // high block to make sure that utxos have enough confirmations (composeTransaction test)
                    blockHash: 'string',
                },
            });
        }
        if (data.type === MESSAGES.ESTIMATE_FEE) {
            this.post({
                id: data.id,
                type: RESPONSES.ESTIMATE_FEE,
                payload: data.payload.blocks.map(() => ({ feePerUnit: '1000' })),
            });
        }
        // eslint-disable-next-line no-undef
        const fixtures = TestUtils.WS_CACHE;
        if (data.type === MESSAGES.GET_ACCOUNT_INFO) {
            this.post({
                id: data.id,
                type: RESPONSES.GET_ACCOUNT_INFO,
                payload: fixtures.getAccountInfo[data.payload.descriptor],
            });
        }
    }

    terminate() {}
}

module.exports = {
    MockedWorker,
};
