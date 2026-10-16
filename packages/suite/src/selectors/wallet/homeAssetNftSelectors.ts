import { shallowEqual } from 'react-redux';

import {
    groupAssetAccountsByAssetKey,
    partitionAssetAccounts,
    sumAssetAccounts,
} from '@suite-common/assets';
import { selectTokenDefinitions } from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AssetAccount,
    type AssetAccountKey,
    type AssetAccountsRootState,
    type WalletAssetKey,
    type WalletSettingsRootState,
    getAssetAccountKey,
    getTokens,
    getWalletAssetKey,
    selectEnabledNetworks,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { isNftToken } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

export type HomeAssetNftState = AssetAccountsRootState & WalletSettingsRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<HomeAssetNftState>();

// A collection is held when it lists its items, even where the backend reports no balance for it.
const isNftHeld = ({ ids, multiTokenValues, balance }: TokenInfo) =>
    (ids?.length ?? 0) > 0 ||
    (multiTokenValues?.length ?? 0) > 0 ||
    new BigNumber(balance ?? '0').gt(0);

const toNftAssetAccount = (account: Account, token: TokenInfo): AssetAccount => {
    const contractAddress = token.contract as TokenAddress;

    return {
        assetAccountKey: getAssetAccountKey({ accountKey: account.key, contractAddress }),
        accountKey: account.key,
        assetKey: getWalletAssetKey({
            deviceState: account.deviceState,
            symbol: account.symbol,
            contractAddress,
        }),
        deviceState: account.deviceState,
        symbol: account.symbol,
        contractAddress,
        cryptoBalance: token.balance ?? '0',
        tokenInfo: token,
    };
};

const selectNftAssetAccounts = createMemoizedSelector([selectVisibleDeviceAccounts], accounts =>
    returnStableArrayIfEmpty(
        accounts.flatMap(account =>
            (account.tokens ?? [])
                .filter(token => isNftToken(token) && isNftHeld(token))
                .map(token => toNftAssetAccount(account, token)),
        ),
    ),
);

/** Hidden by the same rule as on the account's NFT tab: hidden by the user, or not recognized. */
const selectHiddenNftAssetAccountKeySet = createMemoizedSelector(
    [selectNftAssetAccounts, selectTokenDefinitions],
    (assetAccounts, tokenDefinitions): ReadonlySet<AssetAccountKey> => {
        const hidden = new Set<AssetAccountKey>();

        assetAccounts.forEach(({ assetAccountKey, symbol, tokenInfo }) => {
            const { shownWithBalance } = getTokens({
                tokens: tokenInfo === undefined ? [] : [tokenInfo],
                symbol,
                tokenDefinitions: tokenDefinitions?.[symbol]?.nft,
                isNft: true,
            });

            if (shownWithBalance.length === 0) {
                hidden.add(assetAccountKey);
            }
        });

        return hidden;
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
    [selectNftAssetAccounts, selectHiddenNftAssetAccountKeySet],
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

const getSortedCollectionKeys = (
    collections: ReadonlyMap<WalletAssetKey, NftCollection>,
    enabledNetworks: readonly NetworkSymbol[],
): readonly WalletAssetKey[] =>
    returnStableArrayIfEmpty(
        [...collections.values()]
            .filter(collection => enabledNetworks.includes(collection.symbol))
            .toSorted((left, right) => left.name.localeCompare(right.name))
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
