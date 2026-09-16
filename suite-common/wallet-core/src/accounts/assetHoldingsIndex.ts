import {
    createEntityIndex,
    createWeakMapSelector,
    returnStableArrayIfEmpty,
} from '@suite-common/redux-utils';
import {
    type TokenDefinitionsRootState,
    selectTokenDefinitions,
} from '@suite-common/token-definitions';
import { type NetworkSymbol, isNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { type StaticSessionId } from '@trezor/device-utils';

import { type AccountsRootState } from './accountsReducer';
import { selectAccounts } from './accountsSelectors';
import { getTokens } from '../tokens/tokenUtils';

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
export type AssetKey = `${StaticSessionId}/${NetworkSymbol}/${string}`;

const ASSET_KEY_SEPARATOR = '/';

/** The token's contract, or this for the network's own coin, which has none. */
const NATIVE_COIN_CONTRACT = '';

export const getAssetKey = ({
    deviceState,
    symbol,
    contractAddress,
}: {
    deviceState: StaticSessionId;
    symbol: NetworkSymbol;
    contractAddress?: TokenAddress;
}): AssetKey =>
    `${deviceState}${ASSET_KEY_SEPARATOR}${symbol}${ASSET_KEY_SEPARATOR}${contractAddress ?? NATIVE_COIN_CONTRACT}`;

export type AssetKeyParts = {
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
export const parseAssetKey = (key: string): AssetKeyParts | undefined => {
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
 * What one account holds of one asset: its own coin, or one of its tokens.
 *
 * The reducer has no such thing — a coin balance is a field on the account and a token balance is
 * an entry in its `tokens` array — so these are built, and then indexed like any other entity.
 */
export type AssetHolding = {
    accountKey: AccountKey;
    assetKey: AssetKey;
    deviceState: StaticSessionId;
    symbol: NetworkSymbol;
    /** Undefined for the network's own coin. */
    contractAddress: TokenAddress | undefined;
    /** In whole units, the way the account states it. */
    cryptoBalance: string;
    /** The token as the account reported it: its name, symbol and decimals. */
    tokenInfo: TokenInfo | undefined;
    isAccountVisible: boolean;
};

export type AssetHoldingsByAccountKey = ReadonlyMap<AccountKey, readonly AssetHolding[]>;

const areSameHoldings = (previous: readonly AssetHolding[], next: readonly AssetHolding[]) =>
    previous.length === next.length &&
    previous.every((holding, position) => holding === next[position]);

const isSameHolding = (previous: AssetHolding, next: AssetHolding) =>
    previous.cryptoBalance === next.cryptoBalance &&
    previous.tokenInfo === next.tokenInfo &&
    previous.isAccountVisible === next.isAccountVisible;

/**
 * The holdings of one account, reusing the ones built last time wherever nothing about them
 * changed.
 *
 * Identity is the whole point: the index compares entities by reference to decide what a rebuild
 * changed, so a holding that is the same holding has to be the same object. Without this every
 * write would look like every holding changed, and every row watching one would re-render.
 */
const buildAccountHoldings = (
    account: Account,
    shownContracts: ReadonlySet<string>,
    previous: readonly AssetHolding[] | undefined,
): readonly AssetHolding[] => {
    const previousByAssetKey = new Map(previous?.map(holding => [holding.assetKey, holding]));

    const toHolding = (
        contractAddress: TokenAddress | undefined,
        cryptoBalance: string,
        tokenInfo: TokenInfo | undefined,
    ): AssetHolding => {
        const assetKey = getAssetKey({
            deviceState: account.deviceState,
            symbol: account.symbol,
            contractAddress,
        });
        const next: AssetHolding = {
            accountKey: account.key,
            assetKey,
            deviceState: account.deviceState,
            symbol: account.symbol,
            contractAddress,
            cryptoBalance,
            tokenInfo,
            isAccountVisible: account.visible,
        };
        const built = previousByAssetKey.get(assetKey);

        return built && isSameHolding(built, next) ? built : next;
    };

    const tokenHoldings = (account.tokens ?? [])
        .filter(token => shownContracts.has(token.contract))
        .map(token => toHolding(token.contract as TokenAddress, token.balance ?? '0', token));

    return [toHolding(undefined, account.formattedBalance, undefined), ...tokenHoldings];
};

export type AssetHoldingsRootState = AccountsRootState & TokenDefinitionsRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<AssetHoldingsRootState>();

const holdingsByAccountKey = new Map<AccountKey, readonly AssetHolding[]>();

/**
 * Every holding in the store, by the account it belongs to.
 *
 * A `Map` rather than a flat list because the index takes it as its parts: one entry per account is
 * exactly what the reducer writes, so a write to one account rebuilds one account's holdings.
 *
 * Which of an account's tokens count is `getTokens`' decision, made once here rather than at every
 * place that reads a balance: a token the user hid does not become a holding, one the user asked to
 * see does, and a network with no definitions shows what it holds.
 */
export const selectAssetHoldingsByAccountKey = createMemoizedSelector(
    [selectAccounts, selectTokenDefinitions],
    (accounts, tokenDefinitions): AssetHoldingsByAccountKey => {
        const byAccountKey = new Map<AccountKey, readonly AssetHolding[]>();

        accounts.forEach(account => {
            const { shownWithBalance } = getTokens({
                tokens: account.tokens ?? [],
                symbol: account.symbol,
                tokenDefinitions: tokenDefinitions?.[account.symbol]?.coin,
            });
            const shownContracts = new Set(shownWithBalance.map(token => token.contract));
            const previous = holdingsByAccountKey.get(account.key);
            const built = buildAccountHoldings(account, shownContracts, previous);
            // The array's own identity matters too: the index carries an untouched part over
            // instead of walking it, and an account nobody wrote to must look untouched.
            const holdings = previous && areSameHoldings(previous, built) ? previous : built;

            holdingsByAccountKey.set(account.key, holdings);
            byAccountKey.set(account.key, holdings);
        });

        holdingsByAccountKey.forEach((_holdings, accountKey) => {
            if (!byAccountKey.has(accountKey)) {
                holdingsByAccountKey.delete(accountKey);
            }
        });

        return byAccountKey;
    },
);

/**
 * Every holding, by asset and by account.
 *
 * The lookup the asset-first views need — "what does this wallet hold of USD Coin on Polygon" — is
 * `byAsset`, and it answers with the holdings themselves, so adding them up is a pass over what was
 * asked for rather than a search through accounts and their token arrays.
 *
 * It is lazy and shared, and a rebuild only visits the account that was written: see
 * `createEntityIndex`.
 */
export const assetHoldingsIndex = createEntityIndex({
    name: 'assetHoldings',
    selectSource: selectAssetHoldingsByAccountKey,
    getParts: (byAccountKey: AssetHoldingsByAccountKey) => byAccountKey,
    getEntities: (holdings: readonly AssetHolding[]) => holdings,
    getId: (holding: AssetHolding) => `${holding.accountKey}/${holding.contractAddress ?? ''}`,
    groupBy: {
        byAsset: (holding: AssetHolding) => holding.assetKey,
        byAccountKey: (holding: AssetHolding) => holding.accountKey,
    },
});

/** What a wallet holds of one asset, one entry per account holding it. */
export const selectAssetHoldings = (state: AssetHoldingsRootState, assetKey: AssetKey) =>
    assetHoldingsIndex.getBy(state, 'byAsset', assetKey);

export const selectAccountAssetHoldings = (state: AssetHoldingsRootState, accountKey: AccountKey) =>
    assetHoldingsIndex.getBy(state, 'byAccountKey', accountKey);

/**
 * Every asset one wallet holds, as keys for the lookup above.
 *
 * Memoized on the index's snapshot, so this is walked once per write to the accounts, not once per
 * consumer and not once per render.
 */
export const selectAssetKeysByDeviceState = createMemoizedSelector(
    [
        (state: AssetHoldingsRootState) => assetHoldingsIndex.read(state).groups.byAsset,
        (_state: AssetHoldingsRootState, deviceState: StaticSessionId) => deviceState,
    ],
    (assetGroups, deviceState) =>
        returnStableArrayIfEmpty(
            [...assetGroups.keys()].filter(
                assetKey => parseAssetKey(assetKey)?.deviceState === deviceState,
            ),
        ),
);
