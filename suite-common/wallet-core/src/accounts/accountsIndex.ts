import {
    createEntityIndex,
    createWeakMapSelector,
    returnStableArrayIfEmpty,
} from '@suite-common/redux-utils';
import { type NetworkSymbol, isNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/device-utils';
import { BigNumber } from '@trezor/utils';

import { type AccountsRootState } from './accountsReducer';

/**
 * One holding of one asset, by the wallet it belongs to, the network it lives on and — for a token
 * — its contract.
 *
 * This is the identity the asset-first views are keyed on: "USD Coin on Polygon in this wallet" is
 * a different line from "USD Coin on Ethereum", and from the same token in another wallet, while
 * the several accounts a wallet has on one network are the same line added together.
 *
 * The wallet is part of it because an index spans the whole store, and two wallets' balances must
 * never be summed into one row.
 */
export type AccountAssetKey = `${StaticSessionId}/${NetworkSymbol}/${string}`;

const ASSET_KEY_SEPARATOR = '/';

/** The token's contract, or this for the network's own coin, which has none. */
const NATIVE_COIN_CONTRACT = '';

export const getAccountAssetKey = ({
    deviceState,
    symbol,
    contractAddress,
}: {
    deviceState: StaticSessionId;
    symbol: NetworkSymbol;
    contractAddress?: TokenAddress;
}): AccountAssetKey =>
    `${deviceState}${ASSET_KEY_SEPARATOR}${symbol}${ASSET_KEY_SEPARATOR}${contractAddress ?? NATIVE_COIN_CONTRACT}`;

export type AccountAssetKeyParts = {
    deviceState: StaticSessionId;
    symbol: NetworkSymbol;
    /** Undefined for the network's own coin. */
    contractAddress: TokenAddress | undefined;
};

/**
 * Reads the key's parts back, or nothing if it is not one of ours.
 *
 * Taken from the right, because a static session id is itself made of parts and is the only
 * segment that could hold a separator; a symbol and a contract cannot.
 */
export const parseAccountAssetKey = (key: string): AccountAssetKeyParts | undefined => {
    const segments = key.split(ASSET_KEY_SEPARATOR);
    const contract = segments.pop();
    const symbol = segments.pop();
    const deviceState = segments.join(ASSET_KEY_SEPARATOR);

    if (contract === undefined || symbol === undefined || !isNetworkSymbol(symbol)) {
        return undefined;
    }

    return {
        deviceState: deviceState as StaticSessionId,
        symbol,
        contractAddress: contract === NATIVE_COIN_CONTRACT ? undefined : (contract as TokenAddress),
    };
};

/**
 * Every asset an account holds: the network's own coin, and each token it has a balance of.
 *
 * Tokens with no balance are left out — they are not something a wallet holds, and listing them
 * would put a row on every asset-first view for a token that was once touched.
 */
const getAssetKeysOfAccount = (account: Account): AccountAssetKey[] => {
    const toKey = (contractAddress?: TokenAddress) =>
        getAccountAssetKey({
            deviceState: account.deviceState,
            symbol: account.symbol,
            contractAddress,
        });

    const tokenKeys = (account.tokens ?? [])
        .filter(token => new BigNumber(token.balance ?? '0').gt(0))
        .map(token => toKey(token.contract as TokenAddress));

    return [toKey(), ...tokenKeys];
};

/**
 * Every account in the store, by key.
 *
 * The reducer keeps accounts as one flat array, so every lookup that is not "the whole list" is a
 * scan: by device, by network, and — for an asset-first view — by which accounts hold a given
 * token. This turns those into map reads, rebuilt only for the account a write touched.
 *
 * It is lazy and shared: see `createEntityIndex`.
 */
export const accountsIndex = createEntityIndex({
    name: 'accounts',
    selectSource: (state: AccountsRootState) => state.wallet.accounts,
    // One part per account, which is what the reducer writes: it replaces one account object at a
    // time, so every other account is carried over instead of having its tokens walked again.
    getParts: (accounts: Account[]) => accounts.map(account => [account.key, account] as const),
    getEntities: (account: Account) => [account],
    getId: (account: Account): AccountKey => account.key,
    groupBy: {
        /** The accounts of one wallet, without scanning the others. */
        byDeviceState: (account: Account) => account.deviceState,
        byNetworkSymbol: (account: Account) => account.symbol,
        /** The accounts that hold one asset — see `AccountAssetKey`. */
        byAsset: getAssetKeysOfAccount,
    },
});

const createMemoizedSelector = createWeakMapSelector.withTypes<AccountsRootState>();

/** The accounts holding one asset, in store order. Empty when no account holds it. */
export const selectAccountsByAssetKey = (state: AccountsRootState, assetKey: AccountAssetKey) =>
    accountsIndex.getBy(state, 'byAsset', assetKey);

export const selectAccountsByDeviceStateFromIndex = (
    state: AccountsRootState,
    deviceState: StaticSessionId,
) => accountsIndex.getBy(state, 'byDeviceState', deviceState);

export const selectAccountsByNetworkSymbolFromIndex = (
    state: AccountsRootState,
    symbol: NetworkSymbol,
) => accountsIndex.getBy(state, 'byNetworkSymbol', symbol);

/**
 * Every asset one wallet holds, as keys for the lookups above.
 *
 * Memoized on the index's snapshot, so this is walked once per write to the accounts, not once per
 * consumer and not once per render.
 */
export const selectAssetKeysByDeviceState = createMemoizedSelector(
    [
        (state: AccountsRootState) => accountsIndex.read(state).groups.byAsset,
        (_state: AccountsRootState, deviceState: StaticSessionId) => deviceState,
    ],
    (assetGroups, deviceState) =>
        returnStableArrayIfEmpty(
            [...assetGroups.keys()].filter(
                assetKey => parseAccountAssetKey(assetKey)?.deviceState === deviceState,
            ),
        ),
);
