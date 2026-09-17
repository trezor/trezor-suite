import {
    createEntityIndex,
    createWeakMapSelector,
    returnStableArrayIfEmpty,
} from '@suite-common/redux-utils';
import {
    type TokenDefinitionsRootState,
    isTokenDefinitionKnown,
    selectTokenDefinitions,
} from '@suite-common/token-definitions';
import {
    type NetworkSymbol,
    getNetworkFeatures,
    isNetworkSymbol,
} from '@suite-common/wallet-config';
import { type Account, type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { isNftToken } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { type StaticSessionId } from '@trezor/device-utils';
import { BigNumber } from '@trezor/utils';

import { type AccountsRootState } from './accountsReducer';
import { selectAccounts } from './accountsSelectors';

export type AssetKey = `${StaticSessionId}/${NetworkSymbol}/${string}`;

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
    `${deviceState}${ASSET_KEY_SEPARATOR}${symbol}${ASSET_KEY_SEPARATOR}${contractAddress ?? NATIVE_COIN_CONTRACT}`;

export type AssetKeyParts = {
    deviceState: StaticSessionId;
    symbol: NetworkSymbol;
    contractAddress: TokenAddress | undefined;
};

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

export type AssetHoldingKey = `${AccountKey}/${TokenAddress | ''}`;

const toAccountHoldings = (account: Account): readonly AssetHolding[] => {
    const toHolding = (
        contractAddress: TokenAddress | undefined,
        cryptoBalance: string,
        tokenInfo: TokenInfo | undefined,
    ): AssetHolding => ({
        holdingKey: `${account.key}${ASSET_KEY_SEPARATOR}${contractAddress ?? ''}`,
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
    // setting: an NFT is not a holding, and nothing holds none of a token.
    const tokenHoldings = (account.tokens ?? [])
        .filter(token => !isNftToken(token) && new BigNumber(token.balance ?? '0').gt(0))
        .map(token => toHolding(token.contract as TokenAddress, token.balance ?? '0', token));

    return [toHolding(undefined, account.formattedBalance, undefined), ...tokenHoldings];
};

/** A token as the definitions name it: the same token on two networks is two of them. */
const getTokenKey = (symbol: NetworkSymbol, contractAddress: TokenAddress) =>
    `${symbol}${ASSET_KEY_SEPARATOR}${contractAddress}`;

export type AssetHoldingsRootState = AccountsRootState & TokenDefinitionsRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<AssetHoldingsRootState>();

/**
 * Every holding of every account, by asset and by account.
 *
 * An account is a part, so what it holds is worked out when that account is written and not again:
 * flattening a coin and its tokens into holdings is the index's own `getEntities`, which an
 * untouched part never reaches.
 */
export const assetHoldingsIndex = createEntityIndex({
    name: 'assetHoldings',
    selectSource: selectAccounts,
    getParts: (accounts: readonly Account[]) =>
        accounts.map(account => [account.key, account] as const),
    getEntities: toAccountHoldings,
    getId: (holding: AssetHolding) => holding.holdingKey,
    groupBy: {
        byAsset: (holding: AssetHolding) => holding.assetKey,
        byAccountKey: (holding: AssetHolding) => holding.accountKey,
        byTokenKey: (holding: AssetHolding) =>
            holding.contractAddress === undefined
                ? undefined
                : getTokenKey(holding.symbol, holding.contractAddress),
    },
});

/**
 * The holdings of the tokens the user is not shown: the ones hidden by hand, and the ones nothing
 * vouches for that were not asked for anyway.
 *
 * A list of ids for `getInverseOfIds`, so what is shown is everything else. Keyed per token rather
 * than per holding, so the question is asked once for a token however many accounts hold it, and
 * hiding one leaves every other holding in the index exactly as it was.
 */
export const selectHiddenAssetHoldingKeys = createMemoizedSelector(
    [
        (state: AssetHoldingsRootState) => assetHoldingsIndex.read(state).groups.byTokenKey,
        selectTokenDefinitions,
    ],
    (tokenGroups, tokenDefinitions) => {
        const hidden: AssetHoldingKey[] = [];

        tokenGroups.forEach((group, tokenKey) => {
            const separator = tokenKey.indexOf(ASSET_KEY_SEPARATOR);
            const symbol = tokenKey.slice(0, separator);
            const contractAddress = tokenKey.slice(separator + 1);

            if (!isNetworkSymbol(symbol)) {
                return;
            }

            const definitions = tokenDefinitions?.[symbol]?.coin;
            // A network with no definitions to go by shows what it holds — the testnets.
            const hasDefinitions = getNetworkFeatures(symbol).includes('coin-definitions');
            const isHiddenByUser = definitions?.hide?.includes(contractAddress) ?? false;
            const isShownByUser = definitions?.show?.includes(contractAddress) ?? false;
            const isKnown = isTokenDefinitionKnown(definitions?.data, symbol, contractAddress);

            if (isHiddenByUser || (hasDefinitions && !isKnown && !isShownByUser)) {
                group.ids.forEach(id => hidden.push(id));
            }
        });

        return returnStableArrayIfEmpty(hidden);
    },
);

/** What the wallet holds of every asset the user is shown, in the index's order. */
export const selectShownAssetHoldings = (state: AssetHoldingsRootState) =>
    assetHoldingsIndex.getInverseOfIds(state, selectHiddenAssetHoldingKeys(state));
