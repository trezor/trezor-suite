import { shallowEqual } from 'react-redux';

import { selectTokenDefinitions } from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AssetAccountsRootState,
    type WalletAssetKey,
    type WalletSettingsRootState,
    getTokens,
    getWalletAssetKey,
    selectEnabledNetworks,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import { isNftToken } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

export type HomeAssetNftState = AssetAccountsRootState & WalletSettingsRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<HomeAssetNftState>();

/** One account's holding of one collection. */
type NftHolding = {
    assetKey: WalletAssetKey;
    symbol: NetworkSymbol;
    contractAddress: TokenAddress;
    token: TokenInfo;
};

// A collection is held when it lists its items, even where the backend reports no balance for it.
const isNftHeld = ({ ids, multiTokenValues, balance }: TokenInfo) =>
    (ids?.length ?? 0) > 0 ||
    (multiTokenValues?.length ?? 0) > 0 ||
    new BigNumber(balance ?? '0').gt(0);

type PartitionedNftHoldings = {
    shown: readonly NftHolding[];
    hidden: readonly NftHolding[];
};

/** Hidden by the same rule as on the account's NFT tab: hidden by the user, or not recognized. */
const selectPartitionedNftHoldings = createMemoizedSelector(
    [selectVisibleDeviceAccounts, selectTokenDefinitions, selectEnabledNetworks],
    (accounts, tokenDefinitions, enabledNetworks): PartitionedNftHoldings => {
        const shown: NftHolding[] = [];
        const hidden: NftHolding[] = [];

        accounts.forEach(({ deviceState, symbol, tokens }) => {
            if (!enabledNetworks.includes(symbol)) {
                return;
            }

            const nftTokens = (tokens ?? []).filter(token => isNftToken(token) && isNftHeld(token));

            if (nftTokens.length === 0) {
                return;
            }

            const { shownWithBalance } = getTokens({
                tokens: nftTokens,
                symbol,
                tokenDefinitions: tokenDefinitions?.[symbol]?.nft,
                isNft: true,
            });
            const shownTokens = new Set(shownWithBalance);

            nftTokens.forEach(token => {
                const contractAddress = token.contract as TokenAddress;

                (shownTokens.has(token) ? shown : hidden).push({
                    assetKey: getWalletAssetKey({ deviceState, symbol, contractAddress }),
                    symbol,
                    contractAddress,
                    token,
                });
            });
        });

        return { shown: returnStableArrayIfEmpty(shown), hidden: returnStableArrayIfEmpty(hidden) };
    },
);

export type NftItem = {
    id: string;
    amount: string;
};

export type NftCollection = {
    assetKey: WalletAssetKey;
    symbol: NetworkSymbol;
    contractAddress: TokenAddress;
    name: string;
    /** The collection as each account holds it; its items are built only once a row asks for them. */
    tokens: readonly TokenInfo[];
    hasListedItems: boolean;
    /** Where the backend lists no items, what is held is the balance. */
    itemCount: number;
};

const getNftItems = ({ ids, multiTokenValues }: TokenInfo): NftItem[] => [
    ...(ids ?? []).map(id => ({ id, amount: '1' })),
    ...(multiTokenValues ?? []).flatMap(({ id, value }) =>
        id === undefined ? [] : [{ id, amount: value ?? '1' }],
    ),
];

const countNftItems = ({ ids, multiTokenValues }: TokenInfo) =>
    (ids?.length ?? 0) +
    (multiTokenValues ?? []).reduce((count, { id }) => (id === undefined ? count : count + 1), 0);

const groupNftCollections = (
    holdings: readonly NftHolding[],
): ReadonlyMap<WalletAssetKey, NftCollection> => {
    const byKey = new Map<WalletAssetKey, [NftHolding, ...NftHolding[]]>();

    holdings.forEach(holding => {
        const held = byKey.get(holding.assetKey);

        if (held === undefined) {
            byKey.set(holding.assetKey, [holding]);
        } else {
            held.push(holding);
        }
    });

    const collections = new Map<WalletAssetKey, NftCollection>();

    byKey.forEach((held, assetKey) => {
        const [{ symbol, contractAddress, token }] = held;
        const tokens = held.map(holding => holding.token);
        const listedItemCount = tokens.reduce((count, item) => count + countNftItems(item), 0);
        const balance = tokens.reduce(
            (sum, item) => sum.plus(item.balance ?? '0'),
            new BigNumber(0),
        );

        collections.set(assetKey, {
            assetKey,
            symbol,
            contractAddress,
            name: token.name || token.symbol || contractAddress,
            tokens,
            hasListedItems: listedItemCount > 0,
            itemCount: listedItemCount > 0 ? listedItemCount : balance.toNumber(),
        });
    });

    return collections;
};

const countCollections = (holdings: readonly NftHolding[]) =>
    new Set(holdings.map(holding => holding.assetKey)).size;

// The counts skip gathering, items and sorting, so a collapsed section pays only for the split.
export const selectShownNftCollectionCount = createMemoizedSelector(
    [selectPartitionedNftHoldings],
    ({ shown }) => countCollections(shown),
);

export const selectHiddenNftCollectionCount = createMemoizedSelector(
    [selectPartitionedNftHoldings],
    ({ hidden }) => countCollections(hidden),
);

const selectNftCollections = createMemoizedSelector([selectPartitionedNftHoldings], ({ shown }) =>
    groupNftCollections(shown),
);

const selectHiddenNftCollections = createMemoizedSelector(
    [selectPartitionedNftHoldings],
    ({ hidden }) => groupNftCollections(hidden),
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
    [selectNftCollections],
    getSortedCollectionKeys,
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);

export const selectHiddenNftCollectionKeys = createMemoizedSelector(
    [selectHiddenNftCollections],
    getSortedCollectionKeys,
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);

/** One collection, as a row reads it: the same object until that collection changes. */
export const selectNftCollection = (
    state: HomeAssetNftState,
    assetKey: WalletAssetKey,
    isHidden = false,
): NftCollection | undefined =>
    (isHidden ? selectHiddenNftCollections(state) : selectNftCollections(state)).get(assetKey);

const selectNftCollectionTokens = (
    state: HomeAssetNftState,
    assetKey: WalletAssetKey,
    isHidden?: boolean,
) => selectNftCollection(state, assetKey, isHidden)?.tokens;

/** Built only for a collection that is open, and kept until what it holds changes. */
export const selectNftCollectionItems = createMemoizedSelector(
    [selectNftCollectionTokens],
    (tokens): readonly NftItem[] | undefined => tokens?.flatMap(getNftItems),
);
