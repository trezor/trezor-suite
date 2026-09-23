import {
    createEntityIndex,
    createWeakMapSelector,
    returnStableArrayIfEmpty,
} from '@suite-common/redux-utils';
import {
    type TokenDefinitionsRootState,
    selectTokenDefinitions,
} from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { isNftCollection } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { type StaticSessionId } from '@trezor/device-utils';
import { type Branded } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { type AccountsRootState } from './accountsReducer';
import { selectAccounts } from './accountsSelectors';
import { getTokens } from '../tokens/tokenUtils';

/**
 * The index's own keys, spelled out of what they identify and meaningful to this index alone.
 *
 * `AccountKey` is deprecated as a domain key, so nothing outside is invited to take one of these
 * apart: an asset is a wallet, a network and a contract, and a holding is an account's balance of
 * one of them, and both are read off the holding rather than parsed back out of its key.
 */
export type AssetKey = string & Branded<'AssetKey'>;

export type AssetHoldingKey = string & Branded<'AssetHoldingKey'>;

const ASSET_KEY_SEPARATOR = '/';

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
    `${deviceState}${ASSET_KEY_SEPARATOR}${symbol}${ASSET_KEY_SEPARATOR}${contractAddress ?? NATIVE_COIN_CONTRACT}` as AssetKey;

export const getAssetHoldingKey = ({
    accountKey,
    contractAddress,
}: {
    accountKey: AccountKey;
    contractAddress: TokenAddress | undefined;
}): AssetHoldingKey =>
    `${accountKey}${ASSET_KEY_SEPARATOR}${contractAddress ?? NATIVE_COIN_CONTRACT}` as AssetHoldingKey;

export type AssetHolding = {
    /** What the index knows it by: one account's balance of one asset. */
    holdingKey: AssetHoldingKey;
    accountKey: AccountKey;
    assetKey: AssetKey;
    deviceState: StaticSessionId;
    symbol: NetworkSymbol;
    contractAddress: TokenAddress | undefined;
    cryptoBalance: string;
    tokenInfo: TokenInfo | undefined;
    isAccountVisible: boolean;
};

const toAccountHoldings = (account: Account): readonly AssetHolding[] => {
    const toHolding = (
        contractAddress: TokenAddress | undefined,
        cryptoBalance: string,
        tokenInfo: TokenInfo | undefined,
    ): AssetHolding => ({
        holdingKey: getAssetHoldingKey({ accountKey: account.key, contractAddress }),
        accountKey: account.key,
        assetKey: getAssetKey({
            deviceState: account.deviceState,
            symbol: account.symbol,
            contractAddress,
        }),
        deviceState: account.deviceState,
        symbol: account.symbol,
        contractAddress,
        cryptoBalance,
        tokenInfo,
        isAccountVisible: account.visible,
    });

    // Which tokens the user is shown is settled by selectHiddenAssetHoldingKeys, so that hiding one
    // does not rebuild every account's holdings. What is left out here cannot be shown by any
    // setting: a collection is not a holding — it is the NFT section's — and nothing holds none of
    // a token. An account of a network the user enabled is its own answer, however empty it is.
    const coinHoldings = [toHolding(undefined, account.formattedBalance, undefined)];

    const tokenHoldings = (account.tokens ?? [])
        .filter(token => !isNftCollection(token) && new BigNumber(token.balance ?? '0').gt(0))
        .map(token => toHolding(token.contract as TokenAddress, token.balance ?? '0', token));

    return [...coinHoldings, ...tokenHoldings];
};

/** A token as the definitions name it: the same token on two networks is two of them. */
const getTokenKey = (symbol: NetworkSymbol, contractAddress: TokenAddress) =>
    `${symbol}${ASSET_KEY_SEPARATOR}${contractAddress}`;

export type AssetHoldingsRootState = AccountsRootState & TokenDefinitionsRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<AssetHoldingsRootState>();

// What an account holds is worked out when that account is written and not again: a write replaces
// the account it touched and leaves the rest identical, so the rest come back from here.
const holdingsByAccount = new WeakMap<Account, readonly AssetHolding[]>();

const holdingsOf = (account: Account): readonly AssetHolding[] => {
    const known = holdingsByAccount.get(account);

    if (known !== undefined) {
        return known;
    }

    const holdings = toAccountHoldings(account);
    holdingsByAccount.set(account, holdings);

    return holdings;
};

/** Every holding of every account of every wallet, by asset, by account and by token. */
export const assetHoldingsIndex = createEntityIndex({
    name: 'assetHoldings',
    selectSource: selectAccounts,
    getEntities: (accounts: readonly Account[]) => accounts.flatMap(holdingsOf),
    getId: (holding: AssetHolding) => holding.holdingKey,
    secondaryIndexes: {
        byAsset: (holding: AssetHolding) => holding.assetKey,
        byAccountKey: (holding: AssetHolding) => holding.accountKey,
        byTokenKey: (holding: AssetHolding) =>
            holding.contractAddress === undefined
                ? undefined
                : getTokenKey(holding.symbol, holding.contractAddress),
    },
});

/** The holdings of a token the user is not shown, by why they are not shown it. */
export type HiddenAssetHoldings = {
    hiddenByUser: readonly (readonly AssetHolding[])[];
    unrecognized: readonly (readonly AssetHolding[])[];
};

/**
 * The tokens hidden by hand, and the ones nothing vouches for that were not asked for anyway.
 *
 * Which of the two a token is, is not decided here: `getTokens` is what the wallet has always
 * asked, so it is what is asked here — one token at a time, because the index has already gathered
 * the accounts that hold it, and a token an account holds none of is not among them. Asking it
 * rather than repeating it keeps this from drifting: an NFT is left out of both buckets because
 * `getTokens` leaves it out, and the user's own list beats a missing definition there too.
 */
export const selectHiddenAssetHoldings = createMemoizedSelector(
    [
        (state: AssetHoldingsRootState) =>
            assetHoldingsIndex.read(state).getSecondaryIndex('byTokenKey'),
        selectTokenDefinitions,
    ],
    (tokenGroups, tokenDefinitions): HiddenAssetHoldings => {
        const hiddenByUser: (readonly AssetHolding[])[] = [];
        const unrecognized: (readonly AssetHolding[])[] = [];

        tokenGroups.forEach(group => {
            const [holding] = group.entities;

            if (holding?.tokenInfo === undefined) {
                return;
            }

            const { hiddenWithBalance, hiddenWithoutBalance, unverifiedWithBalance } = getTokens({
                tokens: [holding.tokenInfo],
                symbol: holding.symbol,
                tokenDefinitions: tokenDefinitions?.[holding.symbol]?.coin,
                areCollectionsRecognisedByIds: true,
            });

            if (hiddenWithBalance.length + hiddenWithoutBalance.length > 0) {
                hiddenByUser.push(group.entities);
            } else if (unverifiedWithBalance.length > 0) {
                unrecognized.push(group.entities);
            }
        });

        return {
            hiddenByUser: returnStableArrayIfEmpty(hiddenByUser),
            unrecognized: returnStableArrayIfEmpty(unrecognized),
        };
    },
);

/** The keys of all of them, for `sumAsset` to leave out what it is not to add up. */
export const selectHiddenAssetHoldingKeys = createMemoizedSelector(
    [selectHiddenAssetHoldings],
    ({ hiddenByUser, unrecognized }) =>
        returnStableArrayIfEmpty(
            [...hiddenByUser, ...unrecognized].flatMap(holdings =>
                holdings.map(holding => holding.holdingKey),
            ),
        ),
);

/** The same, as a set, for a consumer deciding it holding by holding. */
export const selectHiddenAssetHoldingKeySet = createMemoizedSelector(
    [selectHiddenAssetHoldingKeys],
    (keys): ReadonlySet<AssetHoldingKey> => new Set(keys),
);
