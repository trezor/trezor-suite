import { BackendWebsocketServerMock } from '@trezor/e2e-utils';

import {
    // rippleWorkerFactory,
    rippleModuleFactory,
} from './worker';
import BlockchainLink from '../../src';

const backends = [
    // TODO: nodejs tests are failing, fix it.
    // {
    //     name: 'nodejs-build:ripple',
    //     type: 'ripple',
    //     worker: rippleWorkerFactory,
    // },
    {
        name: 'module-build:ripple',
        type: 'ripple',
        worker: rippleModuleFactory,
    },
];

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

backends.forEach(b => {
    describe(`Ripple ${b.name}`, () => {
        let server: BackendWebsocketServerMock;
        let blockchain: BlockchainLink;

        beforeEach(async () => {
            server = await BackendWebsocketServerMock.create('ripple');
            server.setFixtures(fixtures);
            blockchain = new BlockchainLink({
                name: b.name,
                worker: b.worker,
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
});
