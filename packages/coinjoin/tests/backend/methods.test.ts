import { arrayDistinct } from '@trezor/utils';
import { networks } from '@trezor/utxo-lib';

import { DISCOVERY_LOOKOUT } from '../../src/constants';
import { scanAccount } from '../../src/backend/scanAccount';
import { scanAddress } from '../../src/backend/scanAddress';
import { getAccountInfo } from '../../src/backend/getAccountInfo';
import { CoinjoinFilterController } from '../../src/backend/CoinjoinFilterController';
import { CoinjoinMempoolController } from '../../src/backend/CoinjoinMempoolController';
import * as FIXTURES from '../fixtures/methods.fixture';
import { MockBackendClient } from '../mocks/MockBackendClient';
import type { BlockFilterResponse, Transaction } from '../../src/types/backend';

const EMPTY_CHECKPOINT = {
    blockHash: FIXTURES.BASE_HASH,
    blockHeight: 0,
    receiveCount: DISCOVERY_LOOKOUT,
    changeCount: DISCOVERY_LOOKOUT,
};

describe(`CoinjoinBackend methods`, () => {
    const client = new MockBackendClient();
    const fetchFiltersMock = jest.spyOn(client, 'fetchFilters');
    const fetchBlockMock = jest.spyOn(client, 'fetchBlock');
    const fetchTxMock = jest.spyOn(client, 'fetchTransaction');

    const getRequestedFilters = () =>
        Promise.all(fetchFiltersMock.mock.results.map(res => res.value)).then(
            (response: BlockFilterResponse[]) =>
                response.flatMap(res => res.filters.map(filter => filter.blockHeight as number)),
        );

    const getRequestedBlocks = () =>
        fetchBlockMock.mock.calls
            .map(call => call[0])
            .filter(arrayDistinct)
            .sort();

    const getRequestedTxs = () =>
        fetchTxMock.mock.calls
            .map(call => call[0])
            .filter(arrayDistinct)
            .sort();

    const getContext = <T>(onProgress: (t: T) => void) => ({
        client,
        filters: new CoinjoinFilterController(client, {
            baseBlockHash: FIXTURES.BASE_HASH,
            baseBlockHeight: FIXTURES.BASE_HEIGHT,
            blockbookUrls: ['foo'],
            coordinatorUrl: 'bar',
            network: 'regtest',
        }),
        mempool: new CoinjoinMempoolController(client),
        network: networks.regtest,
        onProgress,
    });

    beforeEach(() => {
        fetchFiltersMock.mockClear();
        fetchBlockMock.mockClear();
        fetchTxMock.mockClear();
        client.setFixture(FIXTURES.BLOCKS);
    });

    it('scanAddress', async () => {
        let txs: Transaction[] = [];

        const { pending } = await scanAddress(
            {
                descriptor: FIXTURES.SEGWIT_RECEIVE_ADDRESSES[0],
                checkpoint: EMPTY_CHECKPOINT,
            },
            getContext(progress => {
                txs = txs.concat(progress.transactions);
            }),
        );

        const info = getAccountInfo({
            descriptor: FIXTURES.SEGWIT_RECEIVE_ADDRESSES[0],
            network: networks.regtest,
            transactions: txs.concat(pending),
        });

        expect(info).toMatchObject(FIXTURES.SEGWIT_RECEIVE_RESULT);

        const filters = await getRequestedFilters();
        expect(filters).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);

        const blocks = getRequestedBlocks();
        expect(blocks).toEqual([1, 2, 4, 6, 7, 8]);
    });

    it('scanAccount at once', async () => {
        let txs: Transaction[] = [];

        const { pending, checkpoint } = await scanAccount(
            {
                descriptor: FIXTURES.SEGWIT_XPUB,
                checkpoint: EMPTY_CHECKPOINT,
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
        // txid_4 is in mempool
        client.setFixture(FIXTURES.BLOCKS.slice(0, 4), [FIXTURES.TX_4_PENDING]);

        const half = await scanAccount(
            {
                descriptor: FIXTURES.SEGWIT_XPUB,
                checkpoint: EMPTY_CHECKPOINT,
            },
            getContext(progress => {
                txs = txs.concat(progress.transactions);
            }),
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

        // Should request only txid_4 transaction from mempool
        // and txid_2 because it has account's inputs (TEMPORARY FIX)
        const halfTxs = getRequestedTxs();
        expect(halfTxs).toEqual(['txid_2', FIXTURES.TX_4_PENDING.txid]);
        fetchTxMock.mockClear();

        // All blocks are known
        client.setFixture(FIXTURES.BLOCKS);

        const full = await scanAccount(
            {
                descriptor: FIXTURES.SEGWIT_XPUB,
                checkpoint: half.checkpoint,
            },
            getContext(progress => {
                txs = txs.concat(progress.transactions);
            }),
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

        // Shouldn't request any transaction from mempool
        // and txid_4 and txid_5 because they have account's inputs (TEMPORARY FIX)
        const restTxs = getRequestedTxs();
        expect(restTxs).toEqual(['txid_4', 'txid_5']);
    });
});
