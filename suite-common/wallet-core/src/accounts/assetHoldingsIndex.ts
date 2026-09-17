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
    accountKey: AccountKey;
    assetKey: AssetKey;
    deviceState: StaticSessionId;
    symbol: NetworkSymbol;
    contractAddress: TokenAddress | undefined;
    cryptoBalance: string;
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

export const selectAssetHoldings = (state: AssetHoldingsRootState, assetKey: AssetKey) =>
    assetHoldingsIndex.getBy(state, 'byAsset', assetKey);

export const selectAccountAssetHoldings = (state: AssetHoldingsRootState, accountKey: AccountKey) =>
    assetHoldingsIndex.getBy(state, 'byAccountKey', accountKey);

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
