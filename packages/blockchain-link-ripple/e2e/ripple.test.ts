import { BlockchainLink } from '@trezor/blockchain-link';
import { BackendWebsocketServerMock } from '@trezor/e2e-utils';

import RippleWorker from '../src';

describe('Ripple', () => {
    let server: BackendWebsocketServerMock;
    let blockchain: BlockchainLink;

    const fixtures = [
        {
            method: 'fee',
            response: {
                type: 'response',
                status: 'success',
                result: {
                    drops: {
                        base_fee: '10',
                        median_fee: '5000',
                        minimum_fee: '10',
                        open_ledger_fee: '10',
                    },
                },
            },
        },
    ];

    beforeEach(async () => {
        server = await BackendWebsocketServerMock.create('ripple');
        server.setFixtures(fixtures);
        blockchain = new BlockchainLink({
            name: 'Ripple',
            worker: RippleWorker,
            server: [`ws://localhost:${server.options.port}`],
            debug: false,
        });
    });

    afterEach(() => {
        blockchain.dispose();
        server.close();
    });

    it('Get fee', async () => {
        const result = await blockchain.estimateFee({ blocks: [1] });
        expect(result).toEqual([{ feePerUnit: '10' }]);
    });
});
