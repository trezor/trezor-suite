import { shallowEqual } from 'react-redux';

import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AssetAccount,
    type AssetAccountsRootState,
    type WalletAssetKey,
    type WalletSettingsRootState,
    selectDeviceNftAssetAccounts,
    selectEnabledNetworks,
    selectHiddenNftAssetAccountKeySet,
} from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import { type TokenInfo } from '@trezor/blockchain-link-types';

import {
    groupAssetAccountsByAssetKey,
    partitionAssetAccounts,
    sumAssetAccounts,
} from './homeAssetTableUtils';

export type HomeAssetNftState = AssetAccountsRootState & WalletSettingsRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<HomeAssetNftState>();

export type NftItem = {
    id: string;
    amount: string;
};

type NftCollection = {
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
    assetAccounts: readonly AssetAccount[],
): ReadonlyMap<WalletAssetKey, NftCollection> => {
    const collections = new Map<WalletAssetKey, NftCollection>();

    groupAssetAccountsByAssetKey(assetAccounts).forEach((held, assetKey) => {
        const [{ symbol, contractAddress, tokenInfo }] = held;

        if (contractAddress === undefined || tokenInfo === undefined) {
            return;
        }

        const tokens = held.flatMap(assetAccount =>
            assetAccount.tokenInfo === undefined ? [] : [assetAccount.tokenInfo],
        );
        const listedItemCount = tokens.reduce((count, token) => count + countNftItems(token), 0);

        collections.set(assetKey, {
            assetKey,
            symbol,
            contractAddress,
            name: tokenInfo.name ?? tokenInfo.symbol ?? contractAddress,
            tokens,
            hasListedItems: listedItemCount > 0,
            itemCount:
                listedItemCount > 0
                    ? listedItemCount
                    : sumAssetAccounts(held).cryptoBalance.toNumber(),
        });
    });

    return collections;
};

const selectPartitionedNftAssetAccounts = createMemoizedSelector(
    [selectDeviceNftAssetAccounts, selectHiddenNftAssetAccountKeySet],
    partitionAssetAccounts,
);

const countCollections = (
    assetAccounts: readonly AssetAccount[],
    enabledNetworks: readonly NetworkSymbol[],
) =>
    new Set(
        assetAccounts
            .filter(assetAccount => enabledNetworks.includes(assetAccount.symbol))
            .map(assetAccount => assetAccount.assetKey),
    ).size;

// The counts skip gathering, items and sorting, so a collapsed section pays only for the split.
export const selectShownNftCollectionCount = createMemoizedSelector(
    [selectPartitionedNftAssetAccounts, selectEnabledNetworks],
    ({ shown }, enabledNetworks) => countCollections(shown, enabledNetworks),
);

export const selectHiddenNftCollectionCount = createMemoizedSelector(
    [selectPartitionedNftAssetAccounts, selectEnabledNetworks],
    ({ hidden }, enabledNetworks) => countCollections(hidden, enabledNetworks),
);

const selectNftCollections = createMemoizedSelector(
    [selectPartitionedNftAssetAccounts],
    ({ shown }) => groupNftCollections(shown),
);

const selectHiddenNftCollections = createMemoizedSelector(
    [selectPartitionedNftAssetAccounts],
    ({ hidden }) => groupNftCollections(hidden),
);

// Spam-heavy wallets hold thousands of collections, and a shared collator sorts them several times
// faster than localeCompare, which builds one per comparison.
const collectionNameCollator = new Intl.Collator();

const getSortedCollectionKeys = (
    collections: ReadonlyMap<WalletAssetKey, NftCollection>,
    enabledNetworks: readonly NetworkSymbol[],
): readonly WalletAssetKey[] =>
    returnStableArrayIfEmpty(
        [...collections.values()]
            .filter(collection => enabledNetworks.includes(collection.symbol))
            .toSorted((left, right) => collectionNameCollator.compare(left.name, right.name))
            .map(collection => collection.assetKey),
    );

export const selectShownNftCollectionKeys = createMemoizedSelector(
    [selectNftCollections, selectEnabledNetworks],
    getSortedCollectionKeys,
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);

export const selectHiddenNftCollectionKeys = createMemoizedSelector(
    [selectHiddenNftCollections, selectEnabledNetworks],
    getSortedCollectionKeys,
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);

const selectNftCollection = (
    state: HomeAssetNftState,
    assetKey: WalletAssetKey,
    isHidden = false,
) => (isHidden ? selectHiddenNftCollections(state) : selectNftCollections(state)).get(assetKey);

export const selectNftCollectionName = (
    state: HomeAssetNftState,
    assetKey: WalletAssetKey,
    isHidden?: boolean,
) => selectNftCollection(state, assetKey, isHidden)?.name;

export const selectNftCollectionSymbol = (
    state: HomeAssetNftState,
    assetKey: WalletAssetKey,
    isHidden?: boolean,
) => selectNftCollection(state, assetKey, isHidden)?.symbol;

export const selectNftCollectionItemCount = (
    state: HomeAssetNftState,
    assetKey: WalletAssetKey,
    isHidden?: boolean,
) => selectNftCollection(state, assetKey, isHidden)?.itemCount;

export const selectNftCollectionHasListedItems = (
    state: HomeAssetNftState,
    assetKey: WalletAssetKey,
    isHidden?: boolean,
) => selectNftCollection(state, assetKey, isHidden)?.hasListedItems ?? false;

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
