import { shallowEqual } from 'react-redux';

import { type DeviceRootState } from '@suite-common/device';
import {
    type TokenDefinitionsRootState,
    selectTokenDefinitions,
} from '@suite-common/token-definitions';
import { type TokenAddress } from '@suite-common/tokens';
import { type Explorer, type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type ExplorerState,
    type WalletAssetKey,
    type WalletSettingsRootState,
    getTokens,
    getWalletAssetKey,
    selectAccountByKey,
    selectEnabledNetworks,
    selectExplorer,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getNftContractExplorerUrl, getNftExplorerUrl } from '@suite-common/wallet-utils';
import { type MultiTokenValue, type TokenInfo } from '@trezor/blockchain-link-types';
import {
    createWeakMapSelector,
    returnStableArrayIfEmpty,
    weakMapMemoize,
} from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

export type NftState = AccountsRootState &
    DeviceRootState &
    TokenDefinitionsRootState &
    WalletSettingsRootState &
    ExplorerState;

const createMemoizedSelector = createWeakMapSelector.withTypes<NftState>();

export type NftHolding = {
    assetKey: WalletAssetKey;
    symbol: NetworkSymbol;
    contractAddress: TokenAddress;
    token: TokenInfo;
};

type ToNftHoldingParams = Pick<Account, 'deviceState' | 'symbol'> & {
    token: TokenInfo;
};

const toNftHolding = ({ deviceState, symbol, token }: ToNftHoldingParams): NftHolding => {
    const contractAddress = token.contract as TokenAddress;

    return {
        assetKey: getWalletAssetKey({ deviceState, networkSymbol: symbol, contractAddress }),
        symbol,
        contractAddress,
        token,
    };
};

/** What a set of accounts holds in NFTs, split as the section lists it: shown, and hidden. */
export type NftHoldings = {
    shown: readonly NftHolding[];
    hidden: readonly NftHolding[];
};

const partitionNftHoldings = (
    accounts: readonly Account[],
    tokenDefinitions: ReturnType<typeof selectTokenDefinitions>,
): NftHoldings => {
    const partitions = accounts.map(({ deviceState, symbol, tokens }) => {
        const { shownWithBalance, hiddenWithBalance, unverifiedWithBalance } = getTokens({
            tokens: tokens ?? [],
            symbol,
            tokenDefinitions: tokenDefinitions?.[symbol]?.nft,
            isNft: true,
        });
        const toHolding = (token: TokenInfo) => toNftHolding({ deviceState, symbol, token });

        return {
            shown: shownWithBalance.map(toHolding),
            hidden: [...hiddenWithBalance, ...unverifiedWithBalance].map(toHolding),
        };
    });

    return {
        shown: returnStableArrayIfEmpty(partitions.flatMap(({ shown }) => shown)),
        hidden: returnStableArrayIfEmpty(partitions.flatMap(({ hidden }) => hidden)),
    };
};

/** The wallet's NFTs, on the networks it has turned on, as Home lists them. */
export const selectWalletNftHoldings = createMemoizedSelector(
    [selectVisibleDeviceAccounts, selectTokenDefinitions, selectEnabledNetworks],
    (accounts, tokenDefinitions, enabledNetworks) =>
        partitionNftHoldings(
            accounts.filter(({ symbol }) => enabledNetworks.includes(symbol)),
            tokenDefinitions,
        ),
);

/** One account's NFTs, as its overview lists them. */
export const selectAccountNftHoldings = createMemoizedSelector(
    [selectAccountByKey, selectTokenDefinitions],
    (account, tokenDefinitions) =>
        partitionNftHoldings(account === null ? [] : [account], tokenDefinitions),
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

/** How many collections the holdings make up, as the collapsed section counts them. */
export const getNftCollectionCount = (held: readonly NftHolding[]) =>
    new Set(held.map(holding => holding.assetKey)).size;

const getNftHoldingsByKey = weakMapMemoize(groupNftHoldings);

const getNftCollections = weakMapMemoize((held: readonly NftHolding[]) =>
    toNftCollections(getNftHoldingsByKey(held)),
);

/** The collections' keys, ordered by name; the same array while the order stays. */
export const getNftCollectionKeys = weakMapMemoize(
    (held: readonly NftHolding[]): readonly WalletAssetKey[] =>
        returnStableArrayIfEmpty(
            [...getNftCollections(held).values()]
                .toSorted((left, right) => left.name.localeCompare(right.name))
                .map(collection => collection.assetKey),
        ),
    { resultEqualityCheck: shallowEqual },
);

export const getNftCollection = (
    held: readonly NftHolding[],
    assetKey: WalletAssetKey,
): NftCollection | undefined => getNftCollections(held).get(assetKey);

export const getNftCollectionItems = weakMapMemoize(
    (
        held: readonly NftHolding[],
        assetKey: WalletAssetKey,
        limit: number,
        explorer: Explorer | undefined,
    ): NftCollectionItems | undefined => {
        const collectionHeld = getNftHoldingsByKey(held).get(assetKey);

        return collectionHeld === undefined
            ? undefined
            : getNftItems(collectionHeld, limit, explorer);
    },
);

export const getNftCollectionExplorerUrl = (
    held: readonly NftHolding[],
    assetKey: WalletAssetKey,
    explorer: Explorer | undefined,
): string | undefined => {
    const [first] = getNftHoldingsByKey(held).get(assetKey) ?? [];

    return first === undefined || explorer === undefined
        ? undefined
        : getNftContractExplorerUrl(explorer, first.token);
};

/** The explorer of the network a collection is on, for its links. */
export const selectNftCollectionExplorer = (
    state: NftState,
    held: readonly NftHolding[],
    assetKey: WalletAssetKey,
) => {
    const collection = getNftCollection(held, assetKey);

    return collection === undefined ? undefined : selectExplorer(state, collection.symbol);
};
