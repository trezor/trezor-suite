import { type AddressProvider, discovery } from '../src/discovery';

describe('discovery', () => {
    // BIP44 / SLIP-44 wallet discovery convention: stop scanning a chain once
    // `lookout` (default 20) consecutive empty addresses are observed from the end.
    // This test uses a smaller lookout (3) and a synthetic provider so the
    // recursion and the trailing-empty count can be exercised deterministically.
    it('stops scanning after `lookout` consecutive empty addresses (gap-limit)', async () => {
        const provider: AddressProvider = {
            getAllDerived: () => [],
            getAddresses: (from, count) =>
                Array.from({ length: count }, (_, i) => ({
                    address: `addr-${from + i}`,
                    path: `m/0/0/${from + i}`,
                })),
        };

        // Indices 0..4 are "used" (non-empty); indices 5+ are empty.
        const used = new Set([0, 1, 2, 3, 4]);
        const discover = (a: { address: string; path: string }) => {
            const i = Number(a.address.replace('addr-', ''));

            return Promise.resolve({ ...a, empty: !used.has(i) });
        };

        const result = await discovery(discover, provider, 3);

        // After address 4 (last used), the next 3 empty addresses (5,6,7) hit
        // the gap-limit and scanning stops — so we should see indices 0..7
        // and no addresses derived past index 7.
        expect(result.map(r => r.address)).toEqual([
            'addr-0',
            'addr-1',
            'addr-2',
            'addr-3',
            'addr-4',
            'addr-5',
            'addr-6',
            'addr-7',
        ]);
        expect(result.slice(0, 5).every(r => !r.empty)).toBe(true);
        expect(result.slice(5).every(r => r.empty)).toBe(true);
    });
});
