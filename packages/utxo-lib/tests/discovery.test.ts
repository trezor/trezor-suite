import { type AddressProvider, createAddressCache, discovery } from '../src/discovery';

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

    // Default lookout: when `discovery` is called WITHOUT the third argument,
    // the default-arg branch at src/discovery.ts:58 binds DISCOVERY_LOOKOUT (=20).
    // A provider that yields only empty addresses lets us verify the default
    // gap-limit by counting how many addresses are derived before scanning stops.
    it('uses the BIP44 default gap-limit of 20 when `lookout` is omitted', async () => {
        const provider: AddressProvider = {
            getAllDerived: () => [],
            getAddresses: (from, count) =>
                Array.from({ length: count }, (_, i) => ({
                    address: `addr-${from + i}`,
                    path: `m/0/0/${from + i}`,
                })),
        };

        const discover = (a: { address: string; path: string }) =>
            Promise.resolve({ ...a, empty: true });

        const result = await discovery(discover, provider);

        expect(result).toHaveLength(20);
        expect(result[0].address).toBe('addr-0');
        expect(result[19].address).toBe('addr-19');
        expect(result.every(r => r.empty)).toBe(true);
    });

    // createAddressCache memoizes deriveAddresses output keyed by xpub+type:
    // the first getAddresses() call derives addresses on demand; subsequent
    // calls covering the same range short-circuit via the cached array, and
    // getAllDerived() returns the accumulated cache. Uses BIP44 test xpub
    // shared with tests/__fixtures__/derivation.ts so the derived addresses
    // are anchored to a known-good vector.
    it('createAddressCache memoizes deriveAddresses output per xpub+type', () => {
        const xpub =
            'xpub6BiVtCpG9fQPxnPmHXG8PhtzQdWC2Su4qWu6XW9tpWFYhxydCLJGrWBJZ5H6qTAHdPQ7pQhtpjiYZVZARo14qHiay2fvrX996oEP42u8wZy';
        const provider = createAddressCache(undefined)(xpub, 'receive');

        // Before any derivation: getAllDerived hits the `cache[key] ?? []`
        // right-arm (cache[key] is undefined) and returns an empty array.
        expect(provider.getAllDerived()).toEqual([]);

        // First getAddresses derives 2 addresses (needed = 2 > 0 truthy arm).
        const first = provider.getAddresses(0, 2);
        expect(first).toEqual([
            { address: '1JAd7XCBzGudGpJQSDSfpmJhiygtLQWaGL', path: "m/44'/0'/0'/0/0" },
            { address: '1GWFxtwWmNVqotUPXLcKVL2mUKpshuJYo', path: "m/44'/0'/0'/0/1" },
        ]);

        // Repeat call same range: needed = 0+2-2 = 0, skips deriveAddresses
        // and serves from cache; returns the same address objects by identity
        // to prove memoization (not a re-derivation).
        const second = provider.getAddresses(0, 2);
        expect(second).toEqual(first);
        expect(second[0]).toBe(first[0]);
        expect(second[1]).toBe(first[1]);

        // After derivation: getAllDerived now hits the `cache[key] ?? []`
        // left-arm and returns the cached array.
        expect(provider.getAllDerived()).toEqual(first);
    });
});
