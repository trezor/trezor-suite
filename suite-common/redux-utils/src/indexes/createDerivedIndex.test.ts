import { createDerivedIndex } from './createDerivedIndex';
import { createIndex } from './createIndex';

type Asset = { key: string; symbol: string; amount: number };

type Rate = { key: string; rate: number };

type Priced = { key: string; fiatValue: number | undefined };

type State = { assets: Asset[]; rates: Rate[] };

const btc: Asset = { key: 'btc', symbol: 'btc', amount: 2 };
const eth: Asset = { key: 'eth', symbol: 'eth', amount: 10 };
const btcRate: Rate = { key: 'btc', rate: 100 };
const ethRate: Rate = { key: 'eth', rate: 5 };

const assetsIndex = createIndex({
    name: 'assets',
    source: (state: State) => state.assets,
    getId: (asset: Asset) => asset.key,
});

const ratesIndex = createIndex({
    name: 'rates',
    source: (state: State) => state.rates,
    getId: (rate: Rate) => rate.key,
});

const price = (asset: Asset, rate: Rate | undefined): Priced => ({
    key: asset.key,
    fiatValue: rate === undefined ? undefined : asset.amount * rate.rate,
});

const createPricedIndex = (derive = jest.fn(price)) => ({
    derive,
    index: createDerivedIndex({
        name: 'priced',
        source: assetsIndex,
        lookups: { rate: ratesIndex },
        getLookupIds: (asset: Asset) => ({ rate: ratesIndex.asId(asset.symbol) }),
        derive: (asset: Asset, { rate }) => derive(asset, rate),
        sort: (left, right) => (right.fiatValue ?? 0) - (left.fiatValue ?? 0),
    }),
});

describe('createDerivedIndex', () => {
    it('builds nothing until it is read', () => {
        const { derive } = createPricedIndex();

        expect(derive).not.toHaveBeenCalled();
    });

    it('derives one entity per source entity, from it and the lookup entities it names', () => {
        const { index } = createPricedIndex();
        const state = { assets: [btc, eth], rates: [btcRate, ethRate] };

        expect(index.getById(state, assetsIndex.asId('btc'))).toEqual({
            key: 'btc',
            fiatValue: 200,
        });
        expect(index.getById(state, assetsIndex.asId('eth'))).toEqual({
            key: 'eth',
            fiatValue: 50,
        });
    });

    it('hands the derivation nothing for a lookup entity that is not there', () => {
        const { index } = createPricedIndex();

        expect(index.getById({ assets: [btc], rates: [] }, assetsIndex.asId('btc'))).toEqual({
            key: 'btc',
            fiatValue: undefined,
        });
    });

    it('orders the ids the way it is told', () => {
        const { index } = createPricedIndex();

        expect(index.getIds({ assets: [eth, btc], rates: [btcRate, ethRate] })).toEqual([
            'btc',
            'eth',
        ]);
    });

    it('keeps the order of the source without a comparator', () => {
        const index = createDerivedIndex({
            name: 'plain',
            source: assetsIndex,
            derive: (asset: Asset) => ({ key: asset.key }),
        });

        expect(index.getIds({ assets: [eth, btc], rates: [] })).toEqual(['eth', 'btc']);
    });

    it('hands back the same snapshot while the source and the lookups stand', () => {
        const { index } = createPricedIndex();
        const snapshot = index.read({ assets: [btc, eth], rates: [btcRate, ethRate] });

        expect(index.read({ assets: [{ ...btc }, eth], rates: [btcRate, { ...ethRate }] })).toBe(
            snapshot,
        );
    });
});

describe('createDerivedIndex following a write', () => {
    it('derives again only the entity whose source changed', () => {
        const { index, derive } = createPricedIndex();
        const before = { assets: [btc, eth], rates: [btcRate, ethRate] };
        const ethBefore = index.getById(before, assetsIndex.asId('eth'));
        derive.mockClear();

        const after = { assets: [{ ...btc, amount: 3 }, eth], rates: [btcRate, ethRate] };

        expect(index.getById(after, assetsIndex.asId('btc'))).toEqual({
            key: 'btc',
            fiatValue: 300,
        });
        expect(index.getById(after, assetsIndex.asId('eth'))).toBe(ethBefore);
        expect(derive).toHaveBeenCalledTimes(1);
        expect(index.read(after).changes).toEqual({ added: [], removed: [], updated: ['btc'] });
    });

    it('derives again only the entities that named the lookup entity that changed', () => {
        const { index, derive } = createPricedIndex();
        const before = { assets: [btc, eth], rates: [btcRate, ethRate] };
        const btcBefore = index.getById(before, assetsIndex.asId('btc'));
        derive.mockClear();

        const after = { assets: [btc, eth], rates: [btcRate, { ...ethRate, rate: 6 }] };

        expect(index.getById(after, assetsIndex.asId('eth'))).toEqual({
            key: 'eth',
            fiatValue: 60,
        });
        expect(index.getById(after, assetsIndex.asId('btc'))).toBe(btcBefore);
        expect(derive).toHaveBeenCalledTimes(1);
    });

    it('does nothing for lookup entities replaced with the same values', () => {
        const { index, derive } = createPricedIndex();
        const snapshot = index.read({ assets: [btc, eth], rates: [btcRate, ethRate] });
        derive.mockClear();

        expect(index.read({ assets: [btc, eth], rates: [{ ...btcRate }, { ...ethRate }] })).toBe(
            snapshot,
        );
        expect(derive).not.toHaveBeenCalled();
    });

    it('keeps the entity when the derivation lands on the same values', () => {
        const { index } = createPricedIndex();
        const before = { assets: [btc, eth], rates: [btcRate, ethRate] };
        const btcBefore = index.getById(before, assetsIndex.asId('btc'));

        const after = { assets: [{ ...btc, symbol: 'btc' }, eth], rates: [btcRate, ethRate] };

        expect(index.getById(after, assetsIndex.asId('btc'))).toBe(btcBefore);
    });

    it('follows additions and removals of the source', () => {
        const { index } = createPricedIndex();
        index.getIds({ assets: [btc], rates: [btcRate, ethRate] });

        const added = { assets: [btc, eth], rates: [btcRate, ethRate] };

        expect(index.getIds(added)).toEqual(['btc', 'eth']);
        expect(index.read(added).changes).toEqual({ added: ['eth'], removed: [], updated: [] });

        const removed = { assets: [eth], rates: [btcRate, ethRate] };

        expect(index.getIds(removed)).toEqual(['eth']);
        expect(index.read(removed).changes).toEqual({ added: [], removed: ['btc'], updated: [] });
    });

    it('reorders when a derived value overtakes another', () => {
        const { index } = createPricedIndex();
        index.getIds({ assets: [btc, eth], rates: [btcRate, ethRate] });

        expect(
            index.getIds({ assets: [btc, eth], rates: [btcRate, { ...ethRate, rate: 500 }] }),
        ).toEqual(['eth', 'btc']);
    });
});
