import { CoinjoinBackendClient } from '../../src/backend/CoinjoinBackendClient';
import { COINJOIN_BACKEND_SETTINGS } from '../fixtures/config.fixture';

const BLOCKBOOKS = ['bb_A', 'bb_B', 'bb_C', 'bb_D', 'bb_E', 'bb_F', 'bb_G'];
const WS_ERROR_403 = 'Unexpected server response: 403';
const WS_ERROR_TIMEOUT = 'Websocket timeout';

describe('CoinjoinBackendClient', () => {
    let client: CoinjoinBackendClient;

    beforeEach(() => {
        client = new CoinjoinBackendClient({
            ...COINJOIN_BACKEND_SETTINGS,
            blockbookUrls: BLOCKBOOKS,
        });
    });

    it('Blockbook backends rotation', async () => {
        let lastBackend = '';
        jest.spyOn((client as any).websockets, 'getOrCreate').mockImplementation(args => {
            [lastBackend] = (args as any).url.split('/');

            return new Proxy({}, { get: (_, b, c) => b !== 'then' && (() => c) });
        });

        const shuffledBackends = (client as any).blockbookUrls as string[];
        expect(shuffledBackends.slice().sort()).toEqual(BLOCKBOOKS.slice().sort());

        await client.fetchBlock(123456);
        let prevIndex = shuffledBackends.indexOf(lastBackend);
        expect(prevIndex).toBeGreaterThanOrEqual(0);

        for (let i = 0; i < 10; ++i) {
            await client.fetchBlock(123456);
            const index = shuffledBackends.indexOf(lastBackend);
            expect(index).toEqual((prevIndex + 1) % shuffledBackends.length);
            prevIndex = index;
        }
    });

    it('Blockbook switch identities on 403', async () => {
        const identities: string[] = [];
        jest.spyOn((client as any).websockets, 'getOrCreate').mockImplementation(args => {
            const { identity } = args as any;
            identities.push(identity);

            return Promise.reject(new Error(identity === 'is' ? 'unknown' : WS_ERROR_403));
        });

        await expect(() =>
            client.fetchBlock(123456, { identity: 'taxation', /* default attempts: 3 */ gap: 0 }),
        ).rejects.toThrow(WS_ERROR_403);
        await expect(() =>
            client.fetchTransaction('txid', { identity: 'is', attempts: 4, gap: 0 }),
        ).rejects.toThrow('unknown');
        await expect(() =>
            client.fetchNetworkInfo({ identity: 'theft', attempts: 2, gap: 0 }),
        ).rejects.toThrow(WS_ERROR_403);

        expect(identities.length).toBe(9);

        expect(identities[0]).toBe('taxation');
        identities.slice(1, 3).forEach((id, i, arr) => {
            expect(id).toMatch(/taxation:[a-zA-Z0-9]+/);
            expect(arr.indexOf(id)).toBe(i);
        });

        identities.slice(3, 7).forEach(id => expect(id).toBe('is'));

        expect(identities[7]).toBe('theft');
        identities.slice(8, 9).forEach((id, i, arr) => {
            expect(id).toMatch(/theft:[a-zA-Z0-9]+/);
            expect(arr.indexOf(id)).toBe(i);
        });
    });

    it('Blockbook onion with fallback', async () => {
        client = new CoinjoinBackendClient({
            ...COINJOIN_BACKEND_SETTINGS,
            blockbookUrls: ['http://bb.x'],
            onionDomains: { 'bb.x': 'bb.onion' },
        });

        const urls: string[] = [];
        const identities: string[] = [];
        jest.spyOn((client as any).websockets, 'getOrCreate').mockImplementation(args => {
            const { url, identity } = args as any;
            urls.push(url);
            identities.push(identity);

            return Promise.reject(
                new Error(url.includes('.onion') ? WS_ERROR_TIMEOUT : WS_ERROR_403),
            );
        });

        await expect(() =>
            client.fetchNetworkInfo({ identity: 'id', attempts: 4, gap: 0 }),
        ).rejects.toThrow(WS_ERROR_403);

        expect(urls).toStrictEqual([
            'http://bb.onion',
            'http://bb.x',
            'http://bb.x',
            'http://bb.x',
        ]);

        const [idA, idB, idC, idD] = identities;
        expect([idA, idB]).toStrictEqual(['id', 'id']);
        expect(idC).toMatch(/id:[a-zA-Z0-9]+/);
        expect(idD).toMatch(/id:[a-zA-Z0-9]+/);
        expect(idC).not.toBe(idD);
    });
});
