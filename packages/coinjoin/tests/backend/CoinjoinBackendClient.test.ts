import { CoinjoinBackendClient } from '../../src/backend/CoinjoinBackendClient';
import { COINJOIN_BACKEND_SETTINGS } from '../fixtures/config.fixture';

const ZERO_HASH = '0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206';
const TIP_HASH = '66a8baf3fe7e759f4682a2c9780efcbb78a9bd938c95d0114737b3fcef709b82';
const NONEXISTENT_HASH = 'deadbeef3cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206';
const MALFORMED_HASH = 'deadbeef';

const VALID_TX = 'd20a1e1f3b98f82dc7aa0fa0538b75be357ab53f2d1c6f68c0be4e7537122f5d';
const INVALID_TX = 'deadbeef';

describe.skip('CoinjoinBackendClient', () => {
    let client: CoinjoinBackendClient;

    beforeAll(() => {
        client = new CoinjoinBackendClient(COINJOIN_BACKEND_SETTINGS);
    });

    it('fetchFilters success', async () => {
        const { filters } = await client.fetchFilters(ZERO_HASH, 10);
        expect(filters.length).toBe(10);
    });

    it('fetchFilters tip', async () => {
        const { filters } = await client.fetchFilters(TIP_HASH, 10);
        expect(filters.length).toBe(0);
    });

    it('fetchFilters bad params', async () => {
        await expect(client.fetchFilters(TIP_HASH, -1)).rejects.toThrow(/^400:/);
    });

    it('fetchFilters not found', async () => {
        await expect(client.fetchFilters(NONEXISTENT_HASH, 10)).rejects.toThrow(
            new RegExp(`404:.*${NONEXISTENT_HASH}`),
        );
    });

    it('fetchFilters malformed', async () => {
        await expect(client.fetchFilters(MALFORMED_HASH, 10)).rejects.toThrow(/^500:/);
    });

    it('fetchMempoolTxids', async () => {
        const res = await client.fetchMempoolTxids();
        expect(Array.isArray(res)).toBe(true);
    });

    it('fetchBlock success', async () => {
        const block = await client.fetchBlock(3);
        expect(block).toMatchObject({ height: 3 });
    });

    it('fetchBlock not found', async () => {
        await expect(client.fetchBlock(999)).rejects.toThrow(/^400:/);
    });

    it('fetchBlocks success', async () => {
        const blocks = await client.fetchBlocks([1, 7, 4]);
        expect(blocks).toMatchObject([{ height: 1 }, { height: 7 }, { height: 4 }]);
    });

    it('fetchBlocks not found', async () => {
        await expect(client.fetchBlocks([1, 999, 222])).rejects.toThrow(/^400:/);
    });

    it('fetchTransaction success', async () => {
        const tx = await client.fetchTransaction(VALID_TX);
        expect(tx).toMatchObject({ txid: VALID_TX, blockHeight: 1 });
    });

    it('fetchTransaction not found', async () => {
        await expect(client.fetchTransaction(INVALID_TX)).rejects.toThrow(/^400:/);
    });
});
