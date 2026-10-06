import { createAggregateIndex } from './createAggregateIndex';
import { createIndex } from './createIndex';

type Account = {
    key: string;
    symbol: string;
    balance: number;
    tokens: { contract: string; balance: number }[];
};

type Position = { account: string; asset: string; balance: number };

type Asset = { asset: string; balance: number; positions: number };

type State = { accounts: Account[] };

const btc1: Account = { key: 'btc-1', symbol: 'btc', balance: 1, tokens: [] };
const btc2: Account = { key: 'btc-2', symbol: 'btc', balance: 2, tokens: [] };
const eth1: Account = {
    key: 'eth-1',
    symbol: 'eth',
    balance: 3,
    tokens: [{ contract: 'usdc', balance: 300 }],
};

const expandAccount = (account: Account): Position[] => [
    { account: account.key, asset: account.symbol, balance: account.balance },
    ...account.tokens.map(token => ({
        account: account.key,
        asset: `${account.symbol}/${token.contract}`,
        balance: token.balance,
    })),
];

const sumInto = (asset: Asset | undefined, position: Position): Asset => ({
    asset: position.asset,
    balance: (asset?.balance ?? 0) + position.balance,
    positions: (asset?.positions ?? 0) + 1,
});

const accountsIndex = createIndex({
    name: 'accounts',
    source: (state: State) => state.accounts,
    getId: (account: Account) => account.key,
});

type CreateAssetsIndexParams = {
    expand?: jest.Mock<Position[], [Account]>;
    reduce?: jest.Mock<Asset, [Asset | undefined, Position]>;
};

const createAssetsIndex = ({
    expand = jest.fn(expandAccount),
    reduce = jest.fn(sumInto),
}: CreateAssetsIndexParams = {}) => ({
    expand,
    reduce,
    index: createAggregateIndex({
        name: 'assets',
        source: accountsIndex,
        expand,
        getId: (position: Position) => position.asset,
        reduce,
    }),
});

describe('createAggregateIndex', () => {
    it('builds nothing until it is read', () => {
        const { expand, reduce } = createAssetsIndex();

        expect(expand).not.toHaveBeenCalled();
        expect(reduce).not.toHaveBeenCalled();
    });

    it('folds what the source entities expand into, by id, in order of first appearance', () => {
        const { index } = createAssetsIndex();
        const state = { accounts: [btc1, eth1, btc2] };

        expect(index.getIds(state)).toEqual(['btc', 'eth', 'eth/usdc']);
        expect(index.getById(state, index.asId('btc'))).toEqual({
            asset: 'btc',
            balance: 3,
            positions: 2,
        });
        expect(index.getById(state, index.asId('eth/usdc'))).toEqual({
            asset: 'eth/usdc',
            balance: 300,
            positions: 1,
        });
    });

    it('leaves out an item whose id is undefined', () => {
        const index = createAggregateIndex({
            name: 'coins',
            source: accountsIndex,
            expand: expandAccount,
            getId: (position: Position) =>
                position.asset.includes('/') ? undefined : position.asset,
            reduce: sumInto,
        });

        expect(index.getIds({ accounts: [btc1, eth1] })).toEqual(['btc', 'eth']);
    });

    it('hands back the same snapshot while the source stands', () => {
        const { index } = createAssetsIndex();
        const snapshot = index.read({ accounts: [btc1, eth1] });

        expect(index.read({ accounts: [btc1, eth1] })).toBe(snapshot);
    });
});

describe('createAggregateIndex following a write', () => {
    it('expands only the source entities that changed', () => {
        const { index, expand } = createAssetsIndex();
        index.getIds({ accounts: [btc1, btc2, eth1] });
        expand.mockClear();

        index.getIds({ accounts: [btc1, { ...btc2, balance: 5 }, eth1] });

        expect(expand).toHaveBeenCalledTimes(1);
        expect(expand).toHaveBeenCalledWith({ ...btc2, balance: 5 });
    });

    it('folds again only the ids the changed entities contribute to', () => {
        const { index, reduce } = createAssetsIndex();
        const before = { accounts: [btc1, btc2, eth1] };
        const ethBefore = index.getById(before, index.asId('eth'));
        const usdcBefore = index.getById(before, index.asId('eth/usdc'));
        reduce.mockClear();

        const after = { accounts: [btc1, { ...btc2, balance: 5 }, eth1] };

        expect(index.getById(after, index.asId('btc'))).toEqual({
            asset: 'btc',
            balance: 6,
            positions: 2,
        });
        expect(index.getById(after, index.asId('eth'))).toBe(ethBefore);
        expect(index.getById(after, index.asId('eth/usdc'))).toBe(usdcBefore);
        expect(reduce).toHaveBeenCalledTimes(2);
        expect(index.read(after).changes).toEqual({ added: [], removed: [], updated: ['btc'] });
    });

    it('keeps the entity when the fold lands on the same values', () => {
        const { index } = createAssetsIndex();
        const before = { accounts: [btc1, btc2] };
        const btcBefore = index.getById(before, index.asId('btc'));

        const after = { accounts: [btc1, { ...btc2 }] };

        expect(index.getById(after, index.asId('btc'))).toBe(btcBefore);
        expect(index.read(after).changes).toEqual({ added: [], removed: [], updated: [] });
    });

    it('adds the ids a new source entity brings and removes those a gone one took', () => {
        const { index } = createAssetsIndex();
        index.getIds({ accounts: [btc1] });

        const added = { accounts: [btc1, eth1] };

        expect(index.getIds(added)).toEqual(['btc', 'eth', 'eth/usdc']);
        expect(index.read(added).changes).toEqual({
            added: ['eth', 'eth/usdc'],
            removed: [],
            updated: [],
        });

        const removed = { accounts: [eth1] };

        expect(index.getIds(removed)).toEqual(['eth', 'eth/usdc']);
        expect(index.read(removed).changes).toEqual({ added: [], removed: ['btc'], updated: [] });
    });

    it('moves an item whose id changed', () => {
        const { index } = createAssetsIndex();
        index.getIds({ accounts: [btc1, eth1] });

        const moved = { accounts: [btc1, { ...eth1, tokens: [{ contract: 'dai', balance: 7 }] }] };

        expect(index.getIds(moved)).toEqual(['btc', 'eth', 'eth/dai']);
        expect(index.read(moved).changes).toEqual({
            added: ['eth/dai'],
            removed: ['eth/usdc'],
            updated: [],
        });
    });

    it('keeps the ids array while the ids stand', () => {
        const { index } = createAssetsIndex();
        const ids = index.getIds({ accounts: [btc1, eth1] });

        expect(index.getIds({ accounts: [{ ...btc1, balance: 9 }, eth1] })).toBe(ids);
    });

    it('expands a source entity once for as long as it is the same object', () => {
        const { index, expand } = createAssetsIndex();
        index.getIds({ accounts: [btc1, eth1] });
        index.getIds({ accounts: [eth1] });
        expand.mockClear();

        index.getIds({ accounts: [btc1, eth1] });

        expect(expand).not.toHaveBeenCalled();
    });
});
