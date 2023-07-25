import { CoinjoinBackendClient } from '../../src/backend/CoinjoinBackendClient';
import { COINJOIN_BACKEND_SETTINGS } from '../fixtures/config.fixture';

const ZERO_HASH = '0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206';
const TIP_HASH = '66a8baf3fe7e759f4682a2c9780efcbb78a9bd938c95d0114737b3fcef709b82';
const NONEXISTENT_HASH = 'deadbeef3cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206';
const MALFORMED_HASH = 'deadbeef';

const VALID_TX = 'd20a1e1f3b98f82dc7aa0fa0538b75be357ab53f2d1c6f68c0be4e7537122f5d';
const INVALID_TX = 'deadbeef';

const BLOCKBOOKS = ['bb_A', 'bb_B', 'bb_C', 'bb_D', 'bb_E', 'bb_F', 'bb_G'];

describe('CoinjoinBackendClient', () => {
    let client: CoinjoinBackendClient;

    beforeEach(() => {
        client = new CoinjoinBackendClient({
            ...COINJOIN_BACKEND_SETTINGS,
            blockbookUrls: BLOCKBOOKS,
        });
    });

    it.only('blockbook backends rotation', async () => {
        let lastBackend = '';
        (client as any).websockets = {
            getOrCreate: ({ url }: { url: string }) => {
                [lastBackend] = (url as string).split('/');
                return new Proxy({}, { get: (_, b, c) => b !== 'then' && (() => c) });
            },
            getSocketId: () => undefined,
        };

        const shuffledBackends = (client as any).blockbookUrls as string[];
        expect(shuffledBackends.slice().sort()).toEqual(BLOCKBOOKS.slice().sort());

        await client.fetchBlock(123456);
        let prevIndex = shuffledBackends.indexOf(lastBackend);
        expect(prevIndex).toBeGreaterThanOrEqual(0);

        for (let i = 0; i < 10; ++i) {
            // eslint-disable-next-line no-await-in-loop
            await client.fetchBlock(123456);
            const index = shuffledBackends.indexOf(lastBackend);
            expect(index).toEqual((prevIndex + 1) % shuffledBackends.length);
            prevIndex = index;
        }
    });

    it('fetchFilters success', async () => {
        const response = await client.fetchFilters(ZERO_HASH, 10);
        expect(response.status).toBe('ok');
        expect((response as any).filters.length).toBe(10);
    });

    it('fetchFilters tip', async () => {
        const { status } = await client.fetchFilters(TIP_HASH, 10);
        expect(status).toBe('up-to-date');
    });

    it('fetchFilters not found', async () => {
        const { status } = await client.fetchFilters(NONEXISTENT_HASH, 10);
        expect(status).toBe('not-found');
    });

    it('fetchFilters bad params', async () => {
        await expect(client.fetchFilters(TIP_HASH, -1)).rejects.toThrow(/^400:/);
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

    it('fetchTransaction success', async () => {
        const tx = await client.fetchTransaction(VALID_TX);
        expect(tx).toMatchObject({ txid: VALID_TX, blockHeight: 1 });
    });

    it('fetchTransaction not found', async () => {
        await expect(client.fetchTransaction(INVALID_TX)).rejects.toThrow(/^400:/);
    });
});
