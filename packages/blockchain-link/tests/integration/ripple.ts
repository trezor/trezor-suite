import { BackendWebsocketServerMock } from '@trezor/e2e-utils';
import BlockchainLink from '../../lib';
import { rippleWorkerFactory, rippleModuleFactory } from './worker';

const backends = [
    {
        name: 'nodejs-build:ripple',
        type: 'ripple',
        worker: rippleWorkerFactory,
    },
    {
        name: 'module-build:ripple',
        type: 'ripple',
        worker: rippleModuleFactory,
    },
];

backends.forEach(b => {
    describe(`Ripple ${b.name}`, () => {
        let server: BackendWebsocketServerMock;
        let blockchain: BlockchainLink;

        beforeEach(async () => {
            server = await BackendWebsocketServerMock.create('ripple');
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
            expect(result).toEqual([{ feePerUnit: '12' }]);
        });
    });
});
