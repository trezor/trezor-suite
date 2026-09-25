import { type DeviceRootState } from '@suite-common/device';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import {
    type TokenDefinitionsRootState,
    selectTokenDefinitions,
} from '@suite-common/token-definitions';
import { type NetworkSymbol, getNetworkFeatures } from '@suite-common/wallet-config';
import { type AccountsRootState, getTokens, selectAccounts } from '@suite-common/wallet-core';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { type StaticSessionId } from '@trezor/device-utils';

export type NftItem = {
    /** The token id inside its collection, which is what an NFT is named by. */
    id: string;
    /** How many of it the wallet holds: one, unless the standard allows more. */
    amount: number;
};

export type NftCollection = {
    collectionKey: string;
    symbol: NetworkSymbol;
    contract: TokenAddress;
    name: string;
    items: readonly NftItem[];
};

/** The collections the user is shown, and the ones they hid or nothing vouches for. */
export type DashboardNfts = {
    shown: readonly NftCollection[];
    hidden: readonly NftCollection[];
};

export type AssetFirstNftsState = AccountsRootState & DeviceRootState & TokenDefinitionsRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<AssetFirstNftsState>();

const EMPTY_NFTS: DashboardNfts = { shown: [], hidden: [] };

const getCollectionKey = (symbol: NetworkSymbol, contract: string) => `${symbol}/${contract}`;

const toItems = (collection: TokenInfo): NftItem[] => {
    const singleTokens = (collection.ids ?? []).map(id => ({ id, amount: 1 }));
    const multiTokens = (collection.multiTokenValues ?? []).map(({ id, value }) => ({
        id: id ?? '',
        amount: Number(value ?? 1),
    }));

    return [...singleTokens, ...multiTokens];
};

// A collection is one thing however many accounts hold part of it, so what an account holds of it
// is added to what the collections gathered so far hold.
const gather = (gathered: Map<string, NftCollection>, symbol: NetworkSymbol, held: TokenInfo[]) => {
    held.forEach(collection => {
        const contract = collection.contract as TokenAddress;
        const collectionKey = getCollectionKey(symbol, contract);
        const known = gathered.get(collectionKey);
        const items = toItems(collection);

        if (known === undefined) {
            gathered.set(collectionKey, {
                collectionKey,
                symbol,
                contract,
                name: collection.name ?? collection.symbol ?? contract,
                items,
            });

            return;
        }

        gathered.set(collectionKey, { ...known, items: [...known.items, ...items] });
    });
};

const byName = (left: NftCollection, right: NftCollection) => left.name.localeCompare(right.name);

/**
 * Every NFT collection of one wallet, by whether the user is shown it.
 *
 * The accounts are walked here rather than through the holdings index: the index leaves NFTs out,
 * because what an NFT is worth is not a balance and the table adds balances up.
 */
export const selectDashboardNfts = createMemoizedSelector(
    [
        selectAccounts,
        selectTokenDefinitions,
        (_state: AssetFirstNftsState, deviceState: StaticSessionId) => deviceState,
    ],
    (accounts, tokenDefinitions, deviceState): DashboardNfts => {
        const shown = new Map<string, NftCollection>();
        const hidden = new Map<string, NftCollection>();

        accounts.forEach((account: Account) => {
            if (
                account.deviceState !== deviceState ||
                !account.visible ||
                !getNetworkFeatures(account.symbol).includes('nfts')
            ) {
                return;
            }

            const collections = getTokens({
                tokens: account.tokens,
                symbol: account.symbol,
                tokenDefinitions: tokenDefinitions?.[account.symbol]?.nft,
                isNft: true,
                areCollectionsRecognisedByIds: true,
            });

            gather(shown, account.symbol, collections.shownWithBalance);
            gather(hidden, account.symbol, [
                ...collections.hiddenWithBalance,
                ...collections.unverifiedWithBalance,
            ]);
        });

        if (shown.size === 0 && hidden.size === 0) {
            return EMPTY_NFTS;
        }

        return {
            shown: returnStableArrayIfEmpty([...shown.values()].sort(byName)),
            hidden: returnStableArrayIfEmpty([...hidden.values()].sort(byName)),
        };
    },
);
