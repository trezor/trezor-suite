import { createIndex } from './createIndex';
import { createSecondaryIndex } from './createSecondaryIndex';
import { type SecondaryIndexKeyOf } from './indexTypes';

// The home asset table in three parts. A selector owns the shape: it flattens the accounts into
// the positions they hold, folds the positions into assets, prices and orders them and gives each
// its key. The index owns identity: an asset the selector rebuilt unchanged keeps its object. Two
// secondary indexes own membership: which assets a wallet holds, which are on a network.

type Token = { contract: string; balance: number };

type Account = {
    key: string;
    deviceState: string;
    symbol: string;
    isVisible: boolean;
    balance: number;
    tokens: Token[];
};

type State = {
    accounts: Account[];
    hiddenContracts: ReadonlySet<string>;
    rates: Record<string, number>;
};

type Asset = {
    assetKey: string;
    deviceState: string;
    symbol: string;
    contract: string | undefined;
    balance: number;
    fiatValue: number;
};

// Deliberately not memoised: every call rebuilds every asset object, which is the worst a
// selector can do to a component and what the index absorbs. Behind `createWeakMapSelector` the
// index would not even be asked while the accounts stand.
const selectAssets = ({ accounts, hiddenContracts, rates }: State): Asset[] => {
    const assets = new Map<string, Asset>();

    const fold = (
        account: Account,
        contract: string | undefined,
        balance: number,
        rateKey: string,
    ) => {
        if (contract !== undefined && hiddenContracts.has(contract)) {
            return;
        }

        const assetKey = `${account.deviceState}/${account.symbol}/${contract ?? ''}`;
        const held = assets.get(assetKey);
        const total = (held?.balance ?? 0) + balance;

        assets.set(assetKey, {
            assetKey,
            deviceState: account.deviceState,
            symbol: account.symbol,
            contract,
            balance: total,
            fiatValue: total * (rates[rateKey] ?? 0),
        });
    };

    accounts
        .filter(account => account.isVisible)
        .forEach(account => {
            fold(account, undefined, account.balance, account.symbol);
            account.tokens.forEach(token =>
                fold(account, token.contract, token.balance, token.contract),
            );
        });

    return [...assets.values()].sort((left, right) => right.fiatValue - left.fiatValue);
};

const assetsIndex = createIndex({
    name: 'assets',
    source: selectAssets,
    getId: (asset: Asset) => asset.assetKey,
});

const assetsByWallet = createSecondaryIndex({
    name: 'assetsByWallet',
    source: assetsIndex,
    getKeys: (asset: Asset) => asset.deviceState,
});

type NetworkKeyParts = { deviceState: string; symbol: string };

// The key's shape is written once, here. An asset has the parts, so `getKeys` is left out, and a
// section that knows its wallet and network but holds no asset builds the key from the parts.
const assetsByNetwork = createSecondaryIndex({
    name: 'assetsByNetwork',
    source: assetsIndex,
    createKey: ({ deviceState, symbol }: NetworkKeyParts) => `${deviceState}/${symbol}`,
});

type NetworkKey = SecondaryIndexKeyOf<typeof assetsByNetwork>;

// What a network is worth: a fold over the entities under its key, which is all the "aggregate
// over a secondary index" the table needs.
const selectNetworkFiatValue = (state: State, networkKey: NetworkKey) =>
    assetsByNetwork
        .getEntities(state, networkKey)
        .reduce((total, asset) => total + asset.fiatValue, 0);

const btc1: Account = {
    key: 'btc-1',
    deviceState: 'wallet-a',
    symbol: 'btc',
    isVisible: true,
    balance: 1,
    tokens: [],
};
const eth1: Account = {
    key: 'eth-1',
    deviceState: 'wallet-a',
    symbol: 'eth',
    isVisible: true,
    balance: 2,
    tokens: [{ contract: 'usdc', balance: 300 }],
};
const eth2: Account = {
    key: 'eth-2',
    deviceState: 'wallet-a',
    symbol: 'eth',
    isVisible: true,
    balance: 3,
    tokens: [{ contract: 'usdc', balance: 700 }],
};
const otherWalletEth: Account = {
    key: 'eth-9',
    deviceState: 'wallet-b',
    symbol: 'eth',
    isVisible: true,
    balance: 99,
    tokens: [],
};

const createState = (accounts: Account[], rest: Partial<Omit<State, 'accounts'>> = {}): State => ({
    accounts,
    hiddenContracts: new Set(),
    rates: { btc: 100_000, eth: 4_000, usdc: 1 },
    ...rest,
});

const BTC = 'wallet-a/btc/';
const ETH = 'wallet-a/eth/';
const USDC = 'wallet-a/eth/usdc';
const WALLET_A = 'wallet-a';
const WALLET_B = 'wallet-b';
const WALLET_A_ETH = assetsByNetwork.createKey({ deviceState: 'wallet-a', symbol: 'eth' });
const WALLET_A_BTC = assetsByNetwork.createKey({ deviceState: 'wallet-a', symbol: 'btc' });

describe('the home asset table as a selector, an index and two secondary indexes', () => {
    it('lists the assets of a wallet, the most valuable first', () => {
        const state = createState([btc1, eth1, eth2, otherWalletEth]);

        expect(assetsByWallet.getIds(state, WALLET_A)).toEqual([BTC, ETH, USDC]);
        expect(assetsByWallet.getIds(state, WALLET_B)).toEqual(['wallet-b/eth/']);
        expect(assetsIndex.getById(state, ETH)).toEqual({
            assetKey: ETH,
            deviceState: 'wallet-a',
            symbol: 'eth',
            contract: undefined,
            balance: 5,
            fiatValue: 20_000,
        });
    });

    it('lists the assets on a network and what the network is worth', () => {
        const state = createState([btc1, eth1, eth2]);

        expect(assetsByNetwork.getIds(state, WALLET_A_ETH)).toEqual([ETH, USDC]);
        expect(selectNetworkFiatValue(state, WALLET_A_ETH)).toBe(21_000);
    });

    it('leaves a hidden token out of the wallet and of its network', () => {
        const state = createState([btc1, eth1, eth2], { hiddenContracts: new Set(['usdc']) });

        expect(assetsByWallet.getIds(state, WALLET_A)).toEqual([BTC, ETH]);
        expect(assetsByNetwork.getIds(state, WALLET_A_ETH)).toEqual([ETH]);
    });

    it('keeps every object the selector rebuilt unchanged', () => {
        const before = createState([btc1, eth1, eth2]);
        const btcBefore = assetsIndex.getById(before, BTC);
        const walletIds = assetsByWallet.getIds(before, WALLET_A);
        const ethNetworkIds = assetsByNetwork.getIds(before, WALLET_A_ETH);

        const same = createState([{ ...btc1 }, { ...eth1 }, { ...eth2 }]);

        expect(assetsIndex.getById(same, BTC)).toBe(btcBefore);
        expect(assetsByWallet.getIds(same, WALLET_A)).toBe(walletIds);
        expect(assetsByNetwork.getIds(same, WALLET_A_ETH)).toBe(ethNetworkIds);
    });

    it('touches only the asset of an account that was written', () => {
        const before = createState([btc1, eth1, eth2]);
        const btcBefore = assetsIndex.getById(before, BTC);
        const usdcBefore = assetsIndex.getById(before, USDC);
        const walletIds = assetsByWallet.getIds(before, WALLET_A);
        const ethNetworkIds = assetsByNetwork.getIds(before, WALLET_A_ETH);
        const btcNetworkEntities = assetsByNetwork.getEntities(before, WALLET_A_BTC);

        const after = createState([btc1, { ...eth1, balance: 4 }, eth2]);

        expect(assetsIndex.getById(after, ETH)?.balance).toBe(7);
        expect(assetsIndex.getById(after, BTC)).toBe(btcBefore);
        expect(assetsIndex.getById(after, USDC)).toBe(usdcBefore);
        expect(assetsByWallet.getIds(after, WALLET_A)).toBe(walletIds);
        expect(assetsByNetwork.getIds(after, WALLET_A_ETH)).toBe(ethNetworkIds);
        expect(assetsByNetwork.getEntities(after, WALLET_A_BTC)).toBe(btcNetworkEntities);
        expect(selectNetworkFiatValue(after, WALLET_A_ETH)).toBe(29_000);
    });

    it('reorders the rows when a value overtakes another', () => {
        const state = createState([btc1, eth1], { rates: { btc: 1, eth: 4_000, usdc: 1 } });

        expect(assetsByWallet.getIds(state, WALLET_A)).toEqual([ETH, USDC, BTC]);
    });

    it('switches wallets without building anything', () => {
        const state = createState([btc1, eth1, otherWalletEth]);
        const { byId } = assetsIndex.read(state);
        const walletIds = assetsByWallet.getIds(state, WALLET_A);

        expect(assetsByWallet.getIds(state, WALLET_B)).toEqual(['wallet-b/eth/']);
        expect(assetsByWallet.getIds(state, WALLET_A)).toBe(walletIds);
        expect(assetsIndex.read(state).byId).toBe(byId);
    });
});
