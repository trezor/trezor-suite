import { shallowEqual } from 'react-redux';

import { type DeviceRootState } from '@suite-common/device';
import { type NetworksRootState, selectNetworkNamesMap } from '@suite-common/networks';
import {
    createAggregateIndex,
    createDerivedIndex,
    createIndex,
    createSecondaryIndex,
    createWeakMapSelector,
    returnStableArrayIfEmpty,
} from '@suite-common/redux-utils';
import { selectTokenDefinitions } from '@suite-common/token-definitions';
import { type NetworkSymbol, getAssetName, getDisplaySymbol } from '@suite-common/wallet-config';
import {
    type AssetAccountsRootState,
    type FiatRatesRootState,
    type WalletAssetKey,
    type WalletSettingsRootState,
    getTokens,
    getWalletAssetKey,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectEnabledNetworks,
    selectLastWeekFiatRates,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { toFiatCurrency } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

export type HomeAssetTableState = AssetAccountsRootState &
    DeviceRootState &
    NetworksRootState &
    FiatRatesRootState &
    WalletSettingsRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<HomeAssetTableState>();

const ZERO_FIAT_VALUE = new BigNumber(0);

// The accounts of the wallet on screen, on the networks the user enabled.

const selectShownAccounts = createMemoizedSelector(
    [selectVisibleDeviceAccounts, selectEnabledNetworks],
    (accounts, enabledNetworks) =>
        returnStableArrayIfEmpty(
            accounts.filter(account => enabledNetworks.includes(account.symbol)),
        ),
);

const accountsIndex = createIndex({
    name: 'homeAssetAccounts',
    source: selectShownAccounts,
    getId: (account: Account) => account.key,
});

// What vouches for a token, per network — joined to each account so that a definition landing
// for one network re-reads the accounts of that network only.

type CoinDefinitions = Parameters<typeof getTokens>[0]['tokenDefinitions'];

type NetworkCoinDefinitions = { symbol: NetworkSymbol; coin: CoinDefinitions };

const selectNetworkCoinDefinitions = createMemoizedSelector(
    [selectTokenDefinitions],
    (definitions): NetworkCoinDefinitions[] =>
        Object.entries(definitions ?? {}).map(([symbol, definition]) => ({
            symbol: symbol as NetworkSymbol,
            coin: definition?.coin,
        })),
);

const coinDefinitionsIndex = createIndex({
    name: 'homeAssetCoinDefinitions',
    source: selectNetworkCoinDefinitions,
    getId: (definitions: NetworkCoinDefinitions) => definitions.symbol,
});

// The positions an account holds that the table shows: its coin, and the tokens with a balance
// that are known or the user asked to see.

type Position = {
    assetKey: WalletAssetKey;
    symbol: NetworkSymbol;
    contractAddress: TokenAddress | undefined;
    balance: string;
    tokenInfo: TokenInfo | undefined;
};

const toShownPositions = (account: Account, coinDefinitions: CoinDefinitions): Position[] => {
    const { deviceState, symbol } = account;
    const { shownWithBalance } = getTokens({
        tokens: account.tokens ?? [],
        symbol,
        tokenDefinitions: coinDefinitions,
    });

    return [
        {
            assetKey: getWalletAssetKey({ deviceState, symbol }),
            symbol,
            contractAddress: undefined,
            balance: account.formattedBalance,
            tokenInfo: undefined,
        },
        ...shownWithBalance.map(token => {
            const contractAddress = token.contract as TokenAddress;

            return {
                assetKey: getWalletAssetKey({ deviceState, symbol, contractAddress }),
                symbol,
                contractAddress,
                balance: token.balance ?? '0',
                tokenInfo: token,
            };
        }),
    ];
};

const positionsIndex = createDerivedIndex({
    name: 'homeAssetPositions',
    source: accountsIndex,
    join: { definitions: coinDefinitionsIndex },
    joinBy: (account: Account) => ({ definitions: account.symbol }),
    toEntity: (account: Account, { definitions }) => toShownPositions(account, definitions?.coin),
});

// The positions folded into the assets of the wallet, one per coin or token.

type WalletAsset = {
    assetKey: WalletAssetKey;
    symbol: NetworkSymbol;
    contractAddress: TokenAddress | undefined;
    amount: string;
    displaySymbol: string;
    name: string;
    tokenSymbol: string | undefined;
    tokenDecimals: number | undefined;
};

const assetsIndex = createAggregateIndex({
    name: 'homeAssets',
    source: positionsIndex,
    expand: (positions: Position[]) => positions,
    getId: (position: Position) => position.assetKey,
    reduce: (asset: WalletAsset | undefined, position: Position): WalletAsset => ({
        assetKey: position.assetKey,
        symbol: position.symbol,
        contractAddress: position.contractAddress,
        amount: new BigNumber(asset?.amount ?? 0).plus(position.balance).toFixed(),
        displaySymbol: getDisplaySymbol(
            position.tokenInfo?.symbol ?? position.symbol,
            position.contractAddress,
        ),
        name: getAssetName({
            symbol: position.symbol,
            tokenName: position.tokenInfo?.name,
            tokenSymbol: position.tokenInfo?.symbol,
        }),
        tokenSymbol: position.tokenInfo?.symbol,
        tokenDecimals: position.tokenInfo?.decimals,
    }),
});

// The rates in the base currency, by the asset they price: its symbol, or its symbol and token
// contract. A rate is a rate entity, so rates replaced with the same values change nothing and a
// rate that moved reaches only the assets it prices.

type RateEntry = { key: string; rate: number | undefined };

const toRateKey = (symbol: NetworkSymbol, contractAddress: TokenAddress | undefined) =>
    contractAddress === undefined ? symbol : `${symbol}-${contractAddress}`;

const toRateEntries = (
    rates: ReturnType<typeof selectCurrentFiatRates>,
    baseCurrency: ReturnType<typeof selectBaseCurrency>,
): RateEntry[] => {
    const suffix = `-${baseCurrency}`;

    return Object.entries(rates ?? {})
        .filter(([key]) => key.endsWith(suffix))
        .map(([key, rate]) => ({ key: key.slice(0, -suffix.length), rate: rate?.rate }));
};

const selectCurrentRateEntries = createMemoizedSelector(
    [selectCurrentFiatRates, selectBaseCurrency],
    toRateEntries,
);
const selectLastWeekRateEntries = createMemoizedSelector(
    [selectLastWeekFiatRates, selectBaseCurrency],
    toRateEntries,
);

const currentRatesIndex = createIndex({
    name: 'homeAssetCurrentRates',
    source: selectCurrentRateEntries,
    getId: (entry: RateEntry) => entry.key,
});

const lastWeekRatesIndex = createIndex({
    name: 'homeAssetLastWeekRates',
    source: selectLastWeekRateEntries,
    getId: (entry: RateEntry) => entry.key,
});

// The assets priced, now and a week ago, the most valuable first.

type PricedAsset = WalletAsset & {
    fiatValue: string | undefined;
    weekAgoFiatValue: string | undefined;
};

const worth = (fiatValue: string | undefined) =>
    fiatValue === undefined ? ZERO_FIAT_VALUE : new BigNumber(fiatValue);

const pricedAssetsIndex = createDerivedIndex({
    name: 'homeAssetsPriced',
    source: assetsIndex,
    join: { rate: currentRatesIndex, weekAgoRate: lastWeekRatesIndex },
    joinBy: (asset: WalletAsset) => {
        const rateKey = toRateKey(asset.symbol, asset.contractAddress);

        return { rate: rateKey, weekAgoRate: rateKey };
    },
    toEntity: (asset: WalletAsset, { rate, weekAgoRate }): PricedAsset => ({
        ...asset,
        fiatValue: toFiatCurrency({ amount: asset.amount, rate: rate?.rate })?.toFixed(),
        weekAgoFiatValue: toFiatCurrency({
            amount: asset.amount,
            rate: weekAgoRate?.rate,
        })?.toFixed(),
    }),
    // `comparedTo` is typed to answer null for a NaN side, which `toFiatCurrency` rules out.
    sort: (left, right) => worth(right.fiatValue).comparedTo(worth(left.fiatValue)) ?? 0,
});

// The assets by network, and what each network is worth. A network nothing can price — a
// testnet, or rates that have yet to land — is worth nothing it can say: a total of zero would
// be a lie.

const assetsByNetwork = createSecondaryIndex({
    name: 'homeAssetsByNetwork',
    source: pricedAssetsIndex,
    getKeys: (asset: PricedAsset) => asset.symbol,
});

type NetworkWorth = { symbol: NetworkSymbol; fiatValue: string | undefined };

const networksIndex = createAggregateIndex({
    name: 'homeAssetNetworks',
    source: pricedAssetsIndex,
    expand: (asset: PricedAsset) => [asset],
    getId: (asset: PricedAsset) => asset.symbol,
    reduce: (network: NetworkWorth | undefined, asset: PricedAsset): NetworkWorth => ({
        symbol: asset.symbol,
        fiatValue:
            asset.fiatValue === undefined
                ? network?.fiatValue
                : worth(network?.fiatValue).plus(asset.fiatValue).toFixed(),
    }),
});

// --- What the table reads.

export const selectShownWalletAssetKeys = pricedAssetsIndex.getIds;

export type HomeAssetGrouping = 'default' | 'networks';

/** The networks the shown assets are held on, the most valuable network first. */
export const selectShownNetworkSymbols = createMemoizedSelector(
    [assetsByNetwork.getKeys, networksIndex.read],
    (symbols, networks): readonly NetworkSymbol[] =>
        returnStableArrayIfEmpty(
            [...symbols].sort(
                (left, right) =>
                    worth(networks.byId.get(right)?.fiatValue).comparedTo(
                        worth(networks.byId.get(left)?.fiatValue),
                    ) ?? 0,
            ),
        ),
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);

export const selectShownWalletAssetKeysOfNetwork = assetsByNetwork.getIds;

export const selectNetworkName = createMemoizedSelector(
    [selectNetworkNamesMap, (_state: HomeAssetTableState, symbol: NetworkSymbol) => symbol],
    (names, symbol) => names?.[symbol],
);

export const selectNetworkFiatValue = (state: HomeAssetTableState, symbol: NetworkSymbol) =>
    networksIndex.getById(state, symbol)?.fiatValue;

const selectWalletAssetField =
    <TField extends keyof PricedAsset>(field: TField) =>
    (state: HomeAssetTableState, assetKey: WalletAssetKey) =>
        pricedAssetsIndex.getById(state, assetKey)?.[field];

export const selectWalletAssetSymbol = selectWalletAssetField('symbol');
export const selectWalletAssetContractAddress = selectWalletAssetField('contractAddress');
export const selectWalletAssetDisplaySymbol = selectWalletAssetField('displaySymbol');
export const selectWalletAssetAmount = selectWalletAssetField('amount');
export const selectWalletAssetTokenSymbol = selectWalletAssetField('tokenSymbol');
export const selectWalletAssetTokenDecimals = selectWalletAssetField('tokenDecimals');

export type HomeAssetTotals = {
    /** Undefined while nothing the wallet holds can be priced — a total of zero would be a lie. */
    fiatValue: BigNumber | undefined;
    weekChange: BigNumber | undefined;
    weekChangePercent: BigNumber | undefined;
};

export const selectHomeAssetTotals = createMemoizedSelector(
    [pricedAssetsIndex.getEntities],
    (assets): HomeAssetTotals => {
        const priced = assets.filter(asset => asset.fiatValue !== undefined);
        const fiatValue =
            priced.length === 0
                ? undefined
                : priced.reduce(
                      (total, asset) => total.plus(worth(asset.fiatValue)),
                      ZERO_FIAT_VALUE,
                  );

        // An asset priced in only one of the two weeks would read as a gain or a loss it never
        // made, so the change is over the assets both weeks could price.
        const comparable = priced.filter(asset => asset.weekAgoFiatValue !== undefined);
        const weekAgoFiatValue = comparable.reduce(
            (total, asset) => total.plus(worth(asset.weekAgoFiatValue)),
            ZERO_FIAT_VALUE,
        );

        if (weekAgoFiatValue.isZero()) {
            return { fiatValue, weekChange: undefined, weekChangePercent: undefined };
        }

        const weekChange = comparable
            .reduce((total, asset) => total.plus(worth(asset.fiatValue)), ZERO_FIAT_VALUE)
            .minus(weekAgoFiatValue);

        return { fiatValue, weekChange, weekChangePercent: weekChange.div(weekAgoFiatValue) };
    },
);
