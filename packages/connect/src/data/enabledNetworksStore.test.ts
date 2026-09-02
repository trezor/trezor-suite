import * as enabledNetworksStore from './enabledNetworksStore';

// Coins are referenced by symbol; the store keys by `coin`.
const coins = (...symbols: string[]) => symbols.map(coin => ({ coin }));

describe('enabledNetworksStore', () => {
    afterEach(() => {
        enabledNetworksStore.set([]);
    });

    it('starts empty', () => {
        expect(enabledNetworksStore.get()).toEqual([]);
        expect(enabledNetworksStore.has('ada')).toBe(false);
    });

    it('set populates the store keyed by coin', () => {
        enabledNetworksStore.set(coins('btc', 'ada'));

        expect(enabledNetworksStore.get()).toEqual(
            expect.arrayContaining([{ coin: 'btc' }, { coin: 'ada' }]),
        );
        expect(enabledNetworksStore.get()).toHaveLength(2);
        expect(enabledNetworksStore.has('ada')).toBe(true);
        expect(enabledNetworksStore.has('btc')).toBe(true);
        expect(enabledNetworksStore.has('eth')).toBe(false);
    });

    it('set replaces the previous value (no merge)', () => {
        enabledNetworksStore.set(coins('btc'));
        enabledNetworksStore.set(coins('eth'));

        expect(enabledNetworksStore.has('btc')).toBe(false);
        expect(enabledNetworksStore.has('eth')).toBe(true);
    });

    it('set deduplicates by coin', () => {
        enabledNetworksStore.set(coins('ada', 'ada', 'btc', 'ada'));

        expect(enabledNetworksStore.get()).toHaveLength(2);
        expect(enabledNetworksStore.has('ada')).toBe(true);
        expect(enabledNetworksStore.has('btc')).toBe(true);
    });

    it('set([]) clears the store', () => {
        enabledNetworksStore.set(coins('ada'));
        enabledNetworksStore.set([]);

        expect(enabledNetworksStore.get()).toEqual([]);
        expect(enabledNetworksStore.has('ada')).toBe(false);
    });

    it('get returns a fresh array each call (callers cannot mutate internal state)', () => {
        enabledNetworksStore.set(coins('btc'));
        const snapshot = enabledNetworksStore.get();
        snapshot.push({ coin: 'eth' });

        expect(enabledNetworksStore.get()).toEqual([{ coin: 'btc' }]);
    });

    describe('add (additive union)', () => {
        it('widens the set without removing existing coins', () => {
            enabledNetworksStore.set(coins('btc', 'eth'));
            enabledNetworksStore.add(coins('ada'));

            expect(enabledNetworksStore.get()).toEqual(
                expect.arrayContaining([{ coin: 'btc' }, { coin: 'eth' }, { coin: 'ada' }]),
            );
            expect(enabledNetworksStore.get()).toHaveLength(3);
        });

        it('add([]) is a no-op', () => {
            enabledNetworksStore.set(coins('btc'));
            enabledNetworksStore.add([]);

            expect(enabledNetworksStore.get()).toEqual([{ coin: 'btc' }]);
        });

        it('add on an empty store behaves like set', () => {
            enabledNetworksStore.add(coins('ada'));

            expect(enabledNetworksStore.has('ada')).toBe(true);
        });
    });

    describe('sanitizes untrusted input', () => {
        it('drops non-object, malformed, and unknown-coin entries', () => {
            enabledNetworksStore.set([
                { coin: 'btc' },
                { coin: '' },
                { coin: 42 },
                'ada',
                null,
                undefined,
                { notACoin: 'eth' },
                { coin: 'meow' },
                { coin: 'ada' },
            ] as any);

            expect(enabledNetworksStore.has('btc')).toBe(true);
            expect(enabledNetworksStore.has('ada')).toBe(true);
            expect(enabledNetworksStore.has('meow')).toBe(false);
            expect(enabledNetworksStore.get()).toHaveLength(2);
        });

        it('normalizes coin case so an uppercase declaration is matched by lowercase has()', () => {
            // `getCoinInfo` is case-insensitive, so `{ coin: 'ADA' }` passes validation. Without
            // normalization it would be keyed as 'ADA', and the AbstractMethod guard's
            // `has('ada')` would miss it — rejecting a Cardano call the caller did enable.
            enabledNetworksStore.set([{ coin: 'ADA' }] as any);

            expect(enabledNetworksStore.has('ada')).toBe(true);
            expect(enabledNetworksStore.has('ADA')).toBe(true);
            expect(enabledNetworksStore.get()).toEqual([{ coin: 'ada' }]);
        });

        it('whitelists fields — keeps only coin, dropping arbitrary untrusted keys', () => {
            enabledNetworksStore.set([
                { coin: 'btc', backends: ['evil.example'], permissions: 'all', extra: 1 },
            ] as any);

            expect(enabledNetworksStore.get()).toEqual([{ coin: 'btc' }]);
        });

        it('coerces a non-array input to an empty set', () => {
            enabledNetworksStore.set('ada' as any);

            expect(enabledNetworksStore.get()).toEqual([]);
            expect(enabledNetworksStore.has('ada')).toBe(false);
        });

        it('add ignores a non-array input (no-op)', () => {
            enabledNetworksStore.set(coins('btc'));
            enabledNetworksStore.add({ coin: 'ada' } as any);

            expect(enabledNetworksStore.get()).toEqual([{ coin: 'btc' }]);
        });
    });
});
