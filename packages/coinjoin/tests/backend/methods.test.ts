import { arrayDistinct } from '@trezor/utils';
import { networks } from '@trezor/utxo-lib';

import { DISCOVERY_LOOKOUT } from '../../src/constants';
import { scanAccount } from '../../src/backend/scanAccount';
import { getAccountInfo } from '../../src/backend/getAccountInfo';
import { CoinjoinFilterController } from '../../src/backend/CoinjoinFilterController';
import { CoinjoinMempoolController } from '../../src/backend/CoinjoinMempoolController';
import * as FIXTURES from '../fixtures/methods.fixture';
import { COINJOIN_BACKEND_SETTINGS } from '../fixtures/config.fixture';
import { MockBackendClient } from '../mocks/MockBackendClient';
import type {
    BlockFilterResponse,
    ScanAccountProgress,
    Transaction,
} from '../../src/types/backend';

const EMPTY_CHECKPOINT = {
    blockHash: FIXTURES.BASE_HASH,
    blockHeight: 0,
    receiveCount: DISCOVERY_LOOKOUT,
    changeCount: DISCOVERY_LOOKOUT,
};

const hasFilters = (r: BlockFilterResponse): r is Extract<BlockFilterResponse, { status: 'ok' }> =>
    r.status === 'ok';

describe(`CoinjoinBackend methods`, () => {
    const client = new MockBackendClient();
    const fetchFiltersMock = jest.spyOn(client, 'fetchFilters');
    const fetchBlockMock = jest.spyOn(client, 'fetchBlock');

    const getRequestedFilters = () =>
        Promise.all(fetchFiltersMock.mock.results.map(res => res.value)).then(
            (response: BlockFilterResponse[]) =>
                response
                    .filter(hasFilters)
                    .flatMap(res => res.filters.map(filter => filter.blockHeight as number)),
        );

    const getRequestedBlocks = () =>
        fetchBlockMock.mock.calls
            .map(call => call[0])
            .filter(arrayDistinct)
            .sort();

    const getContext = (onProgress: (t: ScanAccountProgress) => void) => ({
        client,
        filters: new CoinjoinFilterController(client, {
            ...COINJOIN_BACKEND_SETTINGS,
            baseBlockHash: FIXTURES.BASE_HASH,
            baseBlockHeight: FIXTURES.BASE_HEIGHT,
        }),
        mempool: new CoinjoinMempoolController({ client, network: networks.regtest }),
        network: networks.regtest,
        onProgress,
        onProgressInfo: () => {},
    });

    beforeEach(() => {
        fetchFiltersMock.mockClear();
        fetchBlockMock.mockClear();
        client.setFixture(FIXTURES.BLOCKS);
    });

    it('scanAccount at once', async () => {
        let txs: Transaction[] = [];

        const { pending, checkpoint } = await scanAccount(
            {
                descriptor: FIXTURES.SEGWIT_XPUB,
                checkpoints: [EMPTY_CHECKPOINT],
            },
            getContext(progress => {
                txs = txs.concat(progress.transactions);
            }),
        );

        const info = getAccountInfo({
            descriptor: FIXTURES.SEGWIT_XPUB,
            network: networks.regtest,
            transactions: txs.concat(pending),
            checkpoint,
        });

        expect(info).toMatchObject(FIXTURES.SEGWIT_XPUB_RESULT);

        const filters = await getRequestedFilters();
        expect(filters).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);

        const blocks = getRequestedBlocks();
        expect(blocks).toEqual([1, 2, 4, 6, 7, 8]);
    });

    it('scanAccount differential', async () => {
        let txs: Transaction[] = [];

        // Only four blocks are known,
        // tx 44444444444444444444444444444444 is in mempool
        client.setFixture(FIXTURES.BLOCKS.slice(0, 4), [FIXTURES.TX_4_PENDING]);

        const context = getContext(progress => {
            txs = txs.concat(progress.transactions);
        });

        const half = await scanAccount(
            {
                descriptor: FIXTURES.SEGWIT_XPUB,
                checkpoints: [EMPTY_CHECKPOINT],
            },
            context,
        );

        const halfInfo = getAccountInfo({
            descriptor: FIXTURES.SEGWIT_XPUB,
            network: networks.regtest,
            transactions: txs.concat(half.pending),
            checkpoint: half.checkpoint,
        });

        expect(halfInfo).toMatchObject(FIXTURES.SEGWIT_XPUB_RESULT_HALF);

        // Should request only first four block filters
        const halfFilters = await getRequestedFilters();
        expect(halfFilters).toEqual([1, 2, 3, 4]);
        fetchFiltersMock.mockClear();

        // Should request only first four blocks (except the third which is empty)
        const halfBlocks = getRequestedBlocks();
        expect(halfBlocks).toEqual([1, 2, 4]);
        fetchBlockMock.mockClear();

        // All blocks are known
        client.setFixture(FIXTURES.BLOCKS);

        const full = await scanAccount(
            {
                descriptor: FIXTURES.SEGWIT_XPUB,
                checkpoints: [half.checkpoint],
            },
            context,
        );

        const fullInfo = getAccountInfo({
            descriptor: FIXTURES.SEGWIT_XPUB,
            network: networks.regtest,
            transactions: txs.concat(full.pending),
            checkpoint: full.checkpoint,
        });

        expect(fullInfo).toMatchObject(FIXTURES.SEGWIT_XPUB_RESULT);

        // Should request only block filters after the fourth one
        const restFilters = await getRequestedFilters();
        expect(restFilters).toEqual([5, 6, 7, 8]);

        // Should request only blocks after the fourth one (except the fifth which is empty)
        const restBlocks = getRequestedBlocks();
        expect(restBlocks).toEqual([6, 7, 8]);
    });

    it('scanAccount 1-block reorg', async () => {
        const [PRELAST_BLOCK, LAST_BLOCK] = FIXTURES.BLOCKS.slice(-2);
        const PRELAST_CP = { blockHeight: PRELAST_BLOCK.height, blockHash: PRELAST_BLOCK.hash };
        const REORG_BLOCK = {
            ...LAST_BLOCK,
            hash: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
        };

        // First scan, from initial checkpoint to end
        const { checkpoint: cp1 } = await scanAccount(
            { descriptor: FIXTURES.SEGWIT_XPUB, checkpoints: [EMPTY_CHECKPOINT] },
            getContext(() => {}),
        );

        // First returned checkpoint corresponds to the last block
        expect(cp1.blockHeight).toBe(LAST_BLOCK.height);
        expect(cp1.blockHash).toBe(LAST_BLOCK.hash);

        const progresses: (typeof PRELAST_CP)[] = [];

        // Second scan, from last known checkpoint to end, same data, nothing should change
        const { checkpoint: cp2 } = await scanAccount(
            { descriptor: FIXTURES.SEGWIT_XPUB, checkpoints: [cp1, { ...cp1, ...PRELAST_CP }] },
            getContext(progress => progresses.push(progress.checkpoint)),
        );

        // Second returned checkpoint should be exactly the same as the first one
        expect(cp2.blockHeight).toBe(LAST_BLOCK.height);
        expect(cp2.blockHash).toBe(LAST_BLOCK.hash);
        // No progress should be emitted as nothing changed
        expect(progresses).toHaveLength(0);

        // REORG -> last block's hash changed
        client.setFixture([...FIXTURES.BLOCKS.slice(0, -1), REORG_BLOCK]);

        // Third scan, from last known checkpoint, should signalize last block reorg
        const { checkpoint: cp3 } = await scanAccount(
            { descriptor: FIXTURES.SEGWIT_XPUB, checkpoints: [cp2, { ...cp2, ...PRELAST_CP }] },
            getContext(progress => progresses.push(progress.checkpoint)),
        );

        // Third returned checkpoint corresponds to the reorged last block
        expect(cp3.blockHeight).toBe(REORG_BLOCK.height);
        expect(cp3.blockHash).toBe(REORG_BLOCK.hash);
        // Progress with reorged block should be emitted
        expect(progresses).toHaveLength(1);
        expect(progresses[0]).toEqual(cp3);
    });

    it('scanAccount derive pending', async () => {
        client.setFixture([{ ...FIXTURES.BLOCKS[0], txs: [] }]);

        const scan1 = await scanAccount(
            { descriptor: FIXTURES.SEGWIT_XPUB, checkpoints: [EMPTY_CHECKPOINT] },
            getContext(() => {}),
        );

        const info1 = getAccountInfo({
            descriptor: FIXTURES.SEGWIT_XPUB,
            network: networks.regtest,
            transactions: scan1.pending,
            checkpoint: scan1.checkpoint,
        });

        expect(scan1.checkpoint.receiveCount).toBe(20);
        expect(info1.addresses.unused.length).toBe(20);

        client.setFixture([{ ...FIXTURES.BLOCKS[0], txs: [] }], [FIXTURES.TX_4_PENDING]);

        const scan2 = await scanAccount(
            { descriptor: FIXTURES.SEGWIT_XPUB, checkpoints: [scan1.checkpoint] },
            getContext(() => {}),
        );

        const info2 = getAccountInfo({
            descriptor: FIXTURES.SEGWIT_XPUB,
            network: networks.regtest,
            transactions: scan2.pending,
            checkpoint: scan2.checkpoint,
        });

        expect(scan2.checkpoint.receiveCount).toBe(22);
        expect(info2.addresses.unused.length).toBe(22);
    });
});
