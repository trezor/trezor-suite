import { arrayDistinct } from '@trezor/utils';
import { networks } from '@trezor/utxo-lib';

import { getAccountInfo } from '../../src/backend/getAccountInfo';
import { getAddressInfo } from '../../src/backend/getAddressInfo';
import { CoinjoinFilterController } from '../../src/backend/CoinjoinFilterController.browser';
import { CoinjoinMempoolController } from '../../src/backend/CoinjoinMempoolController';
import * as FIXTURES from '../fixtures/methods.fixture';
import { MockBackendClient } from '../mocks/MockBackendClient';
import type { BlockFilterResponse, DiscoveryContext, MethodContext } from '../../src/backend/types';

const EMPTY_KNOWN_STATE = {
    blockHash: FIXTURES.BASE_HASH,
    receiveCount: 0,
    changeCount: 0,
    transactions: [],
};

describe(`CoinjoinBackend methods`, () => {
    const client = new MockBackendClient();
    const fetchFiltersMock = jest.spyOn(client, 'fetchFilters');
    const fetchBlockMock = jest.spyOn(client, 'fetchBlock');
    const fetchTxMock = jest.spyOn(client, 'fetchTransaction');

    const getRequestedFilters = () =>
        Promise.all(fetchFiltersMock.mock.results.map(res => res.value)).then(
            (res: BlockFilterResponse[]) =>
                res.flatMap(res => res.filters.map(filter => filter.blockHeight as number)),
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

    let context: MethodContext & DiscoveryContext;

    beforeEach(() => {
        const network = networks.regtest;
        context = {
            client,
            controller: new CoinjoinFilterController(client, {
                baseBlockHash: FIXTURES.BASE_HASH,
                baseBlockHeight: FIXTURES.BASE_HEIGHT,
                blockbookUrl: 'foo',
                wabisabiUrl: 'bar',
                network,
            }),
            mempool: new CoinjoinMempoolController(client),
            network,
            onProgress: () => {},
        };
        fetchFiltersMock.mockClear();
        fetchBlockMock.mockClear();
        client.setFixture(FIXTURES.BLOCKS);
    });

    it('getAddressInfo', async () => {
        const info = await getAddressInfo(
            {
                descriptor: FIXTURES.SEGWIT_RECEIVE_ADDRESSES[0],
                knownState: EMPTY_KNOWN_STATE,
            },
            context,
        );

        expect(info).toMatchObject(FIXTURES.SEGWIT_RECEIVE_RESULT);

        const filters = await getRequestedFilters();
        expect(filters).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);

        const blocks = getRequestedBlocks();
        expect(blocks).toEqual([1, 2, 4, 6, 7, 8]);
    });

    it('getAccountInfo at once', async () => {
        const info = await getAccountInfo(
            {
                descriptor: FIXTURES.SEGWIT_XPUB,
                knownState: EMPTY_KNOWN_STATE,
            },
            context,
        );

        expect(info).toMatchObject(FIXTURES.SEGWIT_XPUB_RESULT);

        const filters = await getRequestedFilters();
        expect(filters).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);

        const blocks = getRequestedBlocks();
        expect(blocks).toEqual([1, 2, 4, 6, 7, 8]);
    });

    it('getAccountInfo differential', async () => {
        // Only four blocks are known,
        // txid_4 is in mempool
        client.setFixture(FIXTURES.BLOCKS.slice(0, 4), [FIXTURES.TX_4_PENDING]);

        const half = await getAccountInfo(
            {
                descriptor: FIXTURES.SEGWIT_XPUB,
                knownState: EMPTY_KNOWN_STATE,
            },
            context,
        );

        expect(half).toMatchObject(FIXTURES.SEGWIT_XPUB_RESULT_HALF);

        // Should request only first four block filters
        const halfFilters = await getRequestedFilters();
        expect(halfFilters).toEqual([1, 2, 3, 4]);
        fetchFiltersMock.mockClear();

        // Should request only first four blocks (except the third which is empty)
        const halfBlocks = getRequestedBlocks();
        expect(halfBlocks).toEqual([1, 2, 4]);
        fetchBlockMock.mockClear();

        // Should request only txid_4 transaction from mempool
        const halfTxs = getRequestedTxs();
        expect(halfTxs).toEqual([FIXTURES.TX_4_PENDING.txid]);
        fetchTxMock.mockClear();

        // All blocks are known
        client.setFixture(FIXTURES.BLOCKS);

        const full = await getAccountInfo(
            {
                descriptor: FIXTURES.SEGWIT_XPUB,
                knownState: {
                    blockHash: FIXTURES.BLOCKS[3].hash,
                    receiveCount: half.addresses!.used.length + half.addresses!.unused.length,
                    changeCount: half.addresses!.change.length,
                    transactions: half.history.transactions!,
                },
            },
            context,
        );

        expect(full).toMatchObject(FIXTURES.SEGWIT_XPUB_RESULT);

        // Should request only block filters after the fourth one
        const restFilters = await getRequestedFilters();
        expect(restFilters).toEqual([5, 6, 7, 8]);

        // Should request only blocks after the fourth one (except the fifth which is empty)
        const restBlocks = getRequestedBlocks();
        expect(restBlocks).toEqual([6, 7, 8]);

        // Shouldn't request any transaction from mempool
        const restTxs = getRequestedTxs();
        expect(restTxs).toEqual([]);
    });
});
