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
        join: { rate: ratesIndex },
        joinBy: (asset: Asset) => ({ rate: asset.symbol }),
        toEntity: (asset: Asset, { rate }) => derive(asset, rate),
        sort: (left, right) => (right.fiatValue ?? 0) - (left.fiatValue ?? 0),
    }),
});

describe('createDerivedIndex', () => {
    it('builds nothing until it is read', () => {
        const { derive } = createPricedIndex();

        expect(derive).not.toHaveBeenCalled();
    });

    it('makes one entity per source entity, from it and the entities it is joined to', () => {
        const { index } = createPricedIndex();
        const state = { assets: [btc, eth], rates: [btcRate, ethRate] };

        expect(index.getById(state, 'btc')).toEqual({
            key: 'btc',
            fiatValue: 200,
        });
        expect(index.getById(state, 'eth')).toEqual({
            key: 'eth',
            fiatValue: 50,
        });
    });

    it('hands the making nothing for a joined entity that is not there', () => {
        const { index } = createPricedIndex();

        expect(index.getById({ assets: [btc], rates: [] }, 'btc')).toEqual({
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
            toEntity: (asset: Asset) => ({ key: asset.key }),
        });

        expect(index.getIds({ assets: [eth, btc], rates: [] })).toEqual(['eth', 'btc']);
    });

    it('hands back the same snapshot while the source and the join stand', () => {
        const { index } = createPricedIndex();
        const snapshot = index.read({ assets: [btc, eth], rates: [btcRate, ethRate] });

        expect(index.read({ assets: [{ ...btc }, eth], rates: [btcRate, { ...ethRate }] })).toBe(
            snapshot,
        );
    });
});

describe('createDerivedIndex joining an index over another part of the state', () => {
    type AssetsState = { assets: Asset[] };
    type RatesState = { rates: Rate[] };

    const assetsOnly = createIndex({
        name: 'assetsOnly',
        source: (state: AssetsState) => state.assets,
        getId: (asset: Asset) => asset.key,
    });
    const ratesOnly = createIndex({
        name: 'ratesOnly',
        source: (state: RatesState) => state.rates,
        getId: (rate: Rate) => rate.key,
    });

    it('reads the state both need', () => {
        const priced = createDerivedIndex({
            name: 'pricedAcross',
            source: assetsOnly,
            join: { rate: ratesOnly },
            joinBy: (asset: Asset) => ({ rate: asset.symbol }),
            toEntity: (asset: Asset, { rate }) => price(asset, rate),
        });
        const state: AssetsState & RatesState = { assets: [btc], rates: [btcRate] };

        expect(priced.getById(state, 'btc')).toEqual({ key: 'btc', fiatValue: 200 });

        // @ts-expect-error The rates are missing from this state.
        const readWithoutRates = () => priced.getById({ assets: [btc] }, 'btc');

        expect(readWithoutRates).toBeInstanceOf(Function);
    });
});

describe('createDerivedIndex following a write', () => {
    it('makes again only the entity whose source changed', () => {
        const { index, derive } = createPricedIndex();
        const before = { assets: [btc, eth], rates: [btcRate, ethRate] };
        const ethBefore = index.getById(before, 'eth');
        derive.mockClear();

        const after = { assets: [{ ...btc, amount: 3 }, eth], rates: [btcRate, ethRate] };

        expect(index.getById(after, 'btc')).toEqual({
            key: 'btc',
            fiatValue: 300,
        });
        expect(index.getById(after, 'eth')).toBe(ethBefore);
        expect(derive).toHaveBeenCalledTimes(1);
        expect(index.read(after).changes).toEqual({ added: [], removed: [], updated: ['btc'] });
    });

    it('makes again only the entities joined to the entity that changed', () => {
        const { index, derive } = createPricedIndex();
        const before = { assets: [btc, eth], rates: [btcRate, ethRate] };
        const btcBefore = index.getById(before, 'btc');
        derive.mockClear();

        const after = { assets: [btc, eth], rates: [btcRate, { ...ethRate, rate: 6 }] };

        expect(index.getById(after, 'eth')).toEqual({
            key: 'eth',
            fiatValue: 60,
        });
        expect(index.getById(after, 'btc')).toBe(btcBefore);
        expect(derive).toHaveBeenCalledTimes(1);
    });

    it('does nothing for joined entities replaced with the same values', () => {
        const { index, derive } = createPricedIndex();
        const snapshot = index.read({ assets: [btc, eth], rates: [btcRate, ethRate] });
        derive.mockClear();

        expect(index.read({ assets: [btc, eth], rates: [{ ...btcRate }, { ...ethRate }] })).toBe(
            snapshot,
        );
        expect(derive).not.toHaveBeenCalled();
    });

    it('keeps the entity when the making lands on the same values', () => {
        const { index } = createPricedIndex();
        const before = { assets: [btc, eth], rates: [btcRate, ethRate] };
        const btcBefore = index.getById(before, 'btc');

        const after = { assets: [{ ...btc, symbol: 'btc' }, eth], rates: [btcRate, ethRate] };

        expect(index.getById(after, 'btc')).toBe(btcBefore);
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
