import { createIndex } from './createIndex';
import { createSecondaryIndex } from './createSecondaryIndex';
import { type SecondaryIndexKeyOf } from './indexTypes';

type Asset = { key: string; symbol: string; tags: string[]; balance: number };

type State = { assets: Asset[] };

const btc: Asset = { key: 'btc/', symbol: 'btc', tags: ['coin'], balance: 1 };
const eth: Asset = { key: 'eth/', symbol: 'eth', tags: ['coin', 'evm'], balance: 2 };
const usdc: Asset = { key: 'eth/usdc', symbol: 'eth', tags: ['token', 'evm'], balance: 300 };

const assetsIndex = createIndex({
    name: 'assets',
    source: (state: State) => state.assets,
    getId: (asset: Asset) => asset.key,
});

const createByNetwork = () =>
    createSecondaryIndex({
        name: 'assetsByNetwork',
        source: assetsIndex,
        getKeys: (asset: Asset) => asset.symbol,
    });

const createByTag = () =>
    createSecondaryIndex({
        name: 'assetsByTag',
        source: assetsIndex,
        getKeys: (asset: Asset) => asset.tags,
    });

const ETH = 'eth/';

describe('createSecondaryIndex', () => {
    it('builds nothing until it is read', () => {
        const getKeys = jest.fn((asset: Asset) => asset.symbol);

        createSecondaryIndex({ name: 'lazy', source: assetsIndex, getKeys });

        expect(getKeys).not.toHaveBeenCalled();
    });

    it('lists the ids under a key in the order the primary index holds them', () => {
        const byNetwork = createByNetwork();
        const state = { assets: [usdc, btc, eth] };

        expect(byNetwork.getIds(state, 'eth')).toEqual(['eth/usdc', 'eth/']);
        expect(byNetwork.getIds(state, 'btc')).toEqual(['btc/']);
    });

    it('hands back the very entities the primary index holds', () => {
        const byNetwork = createByNetwork();
        const state = { assets: [btc, eth, usdc] };

        expect(byNetwork.getEntities(state, 'eth')).toEqual([eth, usdc]);
        expect(byNetwork.getEntities(state, 'eth')[0]).toBe(assetsIndex.getById(state, ETH));
    });

    it('files an entity under every key it answers to', () => {
        const byTag = createByTag();
        const state = { assets: [btc, eth, usdc] };

        expect(byTag.getIds(state, 'evm')).toEqual(['eth/', 'eth/usdc']);
        expect(byTag.getIds(state, 'coin')).toEqual(['btc/', 'eth/']);
    });

    it('lists the keys in the order they first appear', () => {
        const byNetwork = createByNetwork();

        expect(byNetwork.getKeys({ assets: [usdc, btc, eth] })).toEqual(['eth', 'btc']);
    });

    it('answers with a shared empty list for a key nobody is under', () => {
        const byNetwork = createByNetwork();
        const state = { assets: [btc] };

        expect(byNetwork.getIds(state, 'eth')).toBe(byNetwork.getIds(state, 'sol'));
        expect(byNetwork.getIds(state, 'eth')).toEqual([]);
    });
});

type NetworkParts = { symbol: string };

type TagParts = { tag: string };

describe('createSecondaryIndex making its keys from parts', () => {
    const createByNetworkParts = () =>
        createSecondaryIndex({
            name: 'assetsByNetworkParts',
            source: assetsIndex,
            createKey: ({ symbol }: NetworkParts) => `network:${symbol}`,
        });

    it('files an entity under the key made from the entity when getKeys is left out', () => {
        const byNetwork = createByNetworkParts();
        const state = { assets: [btc, eth, usdc] };

        expect(byNetwork.getIds(state, byNetwork.createKey({ symbol: 'eth' }))).toEqual([
            'eth/',
            'eth/usdc',
        ]);
        expect(byNetwork.getKeys(state)).toEqual(['network:btc', 'network:eth']);
    });

    it('makes the key the one way, from the entity and from the parts alike', () => {
        const byNetwork = createByNetworkParts();
        const key: SecondaryIndexKeyOf<typeof byNetwork> = byNetwork.createKey({ symbol: 'eth' });
        expect('network:eth').toBe(key);
        // @ts-expect-error The parts are what createKey asks for, not a string.
        byNetwork.createKey('eth');
        // @ts-expect-error A part may not be left out.
        byNetwork.createKey({});
    });

    it('runs the parts getKeys answers through createKey, one key per parts', () => {
        const byTag = createSecondaryIndex({
            name: 'assetsByTagParts',
            source: assetsIndex,
            createKey: ({ tag }: TagParts) => `tag:${tag}`,
            getKeys: (asset: Asset) => asset.tags.map(tag => ({ tag })),
        });
        const state = { assets: [btc, eth, usdc] };

        expect(byTag.getIds(state, byTag.createKey({ tag: 'evm' }))).toEqual(['eth/', 'eth/usdc']);
        expect(byTag.getIds(state, byTag.createKey({ tag: 'coin' }))).toEqual(['btc/', 'eth/']);
    });
});

describe('createSecondaryIndex following the primary index', () => {
    it('hands back the same list while the primary index stands', () => {
        const byNetwork = createByNetwork();
        const key = 'eth';
        const ids = byNetwork.getIds({ assets: [btc, eth, usdc] }, key);

        expect(byNetwork.getIds({ assets: [{ ...btc }, { ...eth }, { ...usdc }] }, key)).toBe(ids);
    });

    it('keeps the list of a key none of whose members moved', () => {
        const byNetwork = createByNetwork();
        const key = 'eth';
        const ethIds = byNetwork.getIds({ assets: [btc, eth, usdc] }, key);

        const written = { assets: [{ ...btc, balance: 2 }, eth, usdc] };

        expect(byNetwork.getIds(written, key)).toBe(ethIds);
        expect(byNetwork.getIds(written, 'btc')).toEqual(['btc/']);
    });

    it('keeps the ids of a key whose member changed but stayed under it', () => {
        const byNetwork = createByNetwork();
        const ethIds = byNetwork.getIds({ assets: [btc, eth, usdc] }, 'eth');

        expect(byNetwork.getIds({ assets: [btc, { ...eth, balance: 9 }, usdc] }, 'eth')).toBe(
            ethIds,
        );
    });

    it('moves an entity whose keys changed', () => {
        const byTag = createByTag();
        const coin = 'coin';
        const state = { assets: [btc, eth, usdc] };
        const coinIds = byTag.getIds(state, coin);

        const written = { assets: [btc, { ...eth, tags: ['evm'] }, usdc] };

        expect(byTag.getIds(written, coin)).toEqual(['btc/']);
        expect(byTag.getIds(written, coin)).not.toBe(coinIds);
        expect(byTag.getIds(written, 'evm')).toEqual(['eth/', 'eth/usdc']);
    });

    it('asks only the entities that changed where they belong', () => {
        const getKeys = jest.fn((asset: Asset) => asset.symbol);
        const byNetwork = createSecondaryIndex({ name: 'byNetwork', source: assetsIndex, getKeys });
        const key = 'eth';
        byNetwork.getIds({ assets: [btc, eth, usdc] }, key);
        getKeys.mockClear();

        byNetwork.getIds({ assets: [btc, { ...eth, balance: 9 }, usdc] }, key);

        expect(getKeys).toHaveBeenCalledTimes(1);
    });

    it('adds and removes entities from their lists and their entities', () => {
        const byNetwork = createByNetwork();
        const key = 'eth';
        const before = { assets: [btc, eth, usdc] };
        const ethIds = byNetwork.getIds(before, key);
        const ethEntities = byNetwork.getEntities(before, key);

        const written = { assets: [eth, { key: 'sol/', symbol: 'sol', tags: [], balance: 5 }] };

        expect(byNetwork.getIds(written, key)).toEqual(['eth/']);
        expect(byNetwork.getIds(written, key)).not.toBe(ethIds);
        expect(byNetwork.getEntities(written, key)).toEqual([eth]);
        expect(byNetwork.getEntities(written, key)).not.toBe(ethEntities);
        expect(byNetwork.getIds(written, 'btc')).toEqual([]);
        expect(byNetwork.getIds(written, 'sol')).toEqual(['sol/']);
        expect(byNetwork.getKeys(written)).toEqual(['eth', 'sol']);
    });

    it('follows the order of the primary index when it changes', () => {
        const byNetwork = createByNetwork();
        const key = 'eth';
        byNetwork.getIds({ assets: [btc, eth, usdc] }, key);

        expect(byNetwork.getIds({ assets: [usdc, eth, btc] }, key)).toEqual(['eth/usdc', 'eth/']);
    });

    it('hands back the same entities while the ids and the entities stand, new ones otherwise', () => {
        const byNetwork = createByNetwork();
        const key = 'eth';
        const entities = byNetwork.getEntities({ assets: [btc, eth, usdc] }, key);

        expect(byNetwork.getEntities({ assets: [{ ...btc, balance: 2 }, eth, usdc] }, key)).toBe(
            entities,
        );

        const changed = byNetwork.getEntities({ assets: [btc, { ...eth, balance: 9 }, usdc] }, key);

        expect(changed).not.toBe(entities);
        expect(changed[0]?.balance).toBe(9);
    });
});
