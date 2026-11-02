import { shallowEqual } from 'react-redux';

import { selectTokenDefinitions } from '@suite-common/token-definitions';
import { type Explorer, type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AssetAccountsRootState,
    type ExplorerState,
    type WalletAssetKey,
    type WalletSettingsRootState,
    getTokens,
    getWalletAssetKey,
    selectEnabledNetworks,
    selectExplorer,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { getNftContractExplorerUrl, getNftExplorerUrl } from '@suite-common/wallet-utils';
import { type MultiTokenValue, type TokenInfo } from '@trezor/blockchain-link-types';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

export type NftState = AssetAccountsRootState & WalletSettingsRootState & ExplorerState;

const createMemoizedSelector = createWeakMapSelector.withTypes<NftState>();

type NftHolding = {
    assetKey: WalletAssetKey;
    symbol: NetworkSymbol;
    contractAddress: TokenAddress;
    token: TokenInfo;
};

type PartitionedNftHoldings = {
    shown: readonly NftHolding[];
    hidden: readonly NftHolding[];
};

type ToNftHoldingParams = Pick<Account, 'deviceState' | 'symbol'> & {
    token: TokenInfo;
};

const toNftHolding = ({ deviceState, symbol, token }: ToNftHoldingParams): NftHolding => {
    const contractAddress = token.contract as TokenAddress;

    return {
        assetKey: getWalletAssetKey({ deviceState, symbol, contractAddress }),
        symbol,
        contractAddress,
        token,
    };
};

const selectPartitionedNftHoldings = createMemoizedSelector(
    [selectVisibleDeviceAccounts, selectTokenDefinitions, selectEnabledNetworks],
    (accounts, tokenDefinitions, enabledNetworks): PartitionedNftHoldings => {
        const partitions = accounts
            .filter(({ symbol }) => enabledNetworks.includes(symbol))
            .map(({ deviceState, symbol, tokens }) => {
                const { shownWithBalance, hiddenWithBalance, unverifiedWithBalance } = getTokens({
                    tokens: tokens ?? [],
                    symbol,
                    tokenDefinitions: tokenDefinitions?.[symbol]?.nft,
                    isNft: true,
                });
                const toHolding = (token: TokenInfo) =>
                    toNftHolding({ deviceState, symbol, token });

                return {
                    shown: shownWithBalance.map(toHolding),
                    hidden: [...hiddenWithBalance, ...unverifiedWithBalance].map(toHolding),
                };
            });

        return {
            shown: returnStableArrayIfEmpty(partitions.flatMap(({ shown }) => shown)),
            hidden: returnStableArrayIfEmpty(partitions.flatMap(({ hidden }) => hidden)),
        };
    },
);

export type NftItem = {
    id: string;
    amount: string;
    explorerUrl: string | undefined;
};

export type NftCollectionItems = {
    items: readonly NftItem[];
    totalCount: number;
};

export type NftCollection = {
    assetKey: WalletAssetKey;
    symbol: NetworkSymbol;
    contractAddress: TokenAddress;
    name: string;
    hasListedItems: boolean;
    itemCount: number;
};

type HoldingsByKey = ReadonlyMap<WalletAssetKey, readonly [NftHolding, ...NftHolding[]]>;

const countListedItems = ({ ids, multiTokenValues }: TokenInfo) =>
    (ids?.length ?? 0) + (multiTokenValues?.length ?? 0);

const getNftItems = (
    held: readonly NftHolding[],
    limit: number,
    explorer: Explorer | undefined,
): NftCollectionItems => ({
    items: held.reduce<NftItem[]>((items, { token }) => {
        const { ids, multiTokenValues } = token;
        const getExplorerUrl = (id: string) =>
            explorer === undefined ? undefined : getNftExplorerUrl(explorer, token, id);
        const room = limit - items.length;

        if (room <= 0) {
            return items;
        }

        const idItems = (ids ?? [])
            .slice(0, room)
            .map(id => ({ id, amount: '1', explorerUrl: getExplorerUrl(id) }));
        const multiTokenItems = (multiTokenValues ?? [])
            .filter((value): value is MultiTokenValue & { id: string } => value.id !== undefined)
            .slice(0, room - idItems.length)
            .map(({ id, value }) => ({
                id,
                amount: value ?? '1',
                explorerUrl: getExplorerUrl(id),
            }));

        return items.concat(idItems, multiTokenItems);
    }, []),
    totalCount: held.reduce((count, { token }) => count + countListedItems(token), 0),
});

const groupNftHoldings = (holdings: readonly NftHolding[]): HoldingsByKey =>
    holdings.reduce((byKey, holding) => {
        const held = byKey.get(holding.assetKey);

        if (held === undefined) {
            byKey.set(holding.assetKey, [holding]);
        } else {
            held.push(holding);
        }

        return byKey;
    }, new Map<WalletAssetKey, [NftHolding, ...NftHolding[]]>());

const countHeldItems = (token: TokenInfo) => {
    const listedItemCount = countListedItems(token);

    return listedItemCount > 0 ? listedItemCount : new BigNumber(token.balance ?? '0').toNumber();
};

const toNftCollection = (
    assetKey: WalletAssetKey,
    held: readonly [NftHolding, ...NftHolding[]],
): NftCollection => {
    const [{ symbol, contractAddress, token }] = held;

    return {
        assetKey,
        symbol,
        contractAddress,
        name: token.name || token.symbol || contractAddress,
        hasListedItems: held.some(holding => countListedItems(holding.token) > 0),
        itemCount: held.reduce((count, holding) => count + countHeldItems(holding.token), 0),
    };
};

const toNftCollections = (byKey: HoldingsByKey): ReadonlyMap<WalletAssetKey, NftCollection> =>
    new Map(Array.from(byKey, ([assetKey, held]) => [assetKey, toNftCollection(assetKey, held)]));

const countCollections = (holdings: readonly NftHolding[]) =>
    new Set(holdings.map(holding => holding.assetKey)).size;

export const selectShownNftCollectionCount = createMemoizedSelector(
    [selectPartitionedNftHoldings],
    ({ shown }) => countCollections(shown),
);

export const selectHiddenNftCollectionCount = createMemoizedSelector(
    [selectPartitionedNftHoldings],
    ({ hidden }) => countCollections(hidden),
);

const selectShownNftHoldingsByKey = createMemoizedSelector(
    [selectPartitionedNftHoldings],
    ({ shown }) => groupNftHoldings(shown),
);

const selectHiddenNftHoldingsByKey = createMemoizedSelector(
    [selectPartitionedNftHoldings],
    ({ hidden }) => groupNftHoldings(hidden),
);

const selectShownNftCollections = createMemoizedSelector(
    [selectShownNftHoldingsByKey],
    toNftCollections,
);

const selectHiddenNftCollections = createMemoizedSelector(
    [selectHiddenNftHoldingsByKey],
    toNftCollections,
);

const getSortedCollectionKeys = (
    collections: ReadonlyMap<WalletAssetKey, NftCollection>,
): readonly WalletAssetKey[] =>
    returnStableArrayIfEmpty(
        [...collections.values()]
            .toSorted((left, right) => left.name.localeCompare(right.name))
            .map(collection => collection.assetKey),
    );

export const selectShownNftCollectionKeys = createMemoizedSelector(
    [selectShownNftCollections],
    getSortedCollectionKeys,
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);

export const selectHiddenNftCollectionKeys = createMemoizedSelector(
    [selectHiddenNftCollections],
    getSortedCollectionKeys,
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);

export const selectNftCollection = (
    state: NftState,
    assetKey: WalletAssetKey,
    isHidden = false,
): NftCollection | undefined =>
    (isHidden ? selectHiddenNftCollections(state) : selectShownNftCollections(state)).get(assetKey);

const selectNftCollectionHoldings = (
    state: NftState,
    assetKey: WalletAssetKey,
    isHidden: boolean,
) =>
    (isHidden ? selectHiddenNftHoldingsByKey(state) : selectShownNftHoldingsByKey(state)).get(
        assetKey,
    );

const selectNftCollectionExplorer = (
    state: NftState,
    assetKey: WalletAssetKey,
    isHidden: boolean,
) => {
    const held = selectNftCollectionHoldings(state, assetKey, isHidden);

    return held === undefined ? undefined : selectExplorer(state, held[0].symbol);
};

export const selectNftCollectionItems = createMemoizedSelector(
    [
        selectNftCollectionHoldings,
        (_state: NftState, _assetKey: WalletAssetKey, _isHidden: boolean, limit: number) => limit,
        selectNftCollectionExplorer,
    ],
    (held, limit, explorer): NftCollectionItems | undefined =>
        held === undefined ? undefined : getNftItems(held, limit, explorer),
);

export const selectNftCollectionExplorerUrl = (
    state: NftState,
    assetKey: WalletAssetKey,
    isHidden: boolean,
): string | undefined => {
    const held = selectNftCollectionHoldings(state, assetKey, isHidden);
    const explorer = selectNftCollectionExplorer(state, assetKey, isHidden);

    return held === undefined || explorer === undefined
        ? undefined
        : getNftContractExplorerUrl(explorer, held[0].token);
};
