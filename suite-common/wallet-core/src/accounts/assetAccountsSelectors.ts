import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import {
    type TokenDefinitionsRootState,
    selectTokenDefinitions,
} from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { isNftToken } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { type StaticSessionId } from '@trezor/device-utils';
import { type Branded } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { type AccountsRootState } from './accountsReducer';
import { selectAccounts } from './accountsSelectors';
import { getTokens } from '../tokens/tokenUtils';

export type WalletAssetKey = string & Branded<'WalletAssetKey'>;

export type AssetAccountKey = string & Branded<'AssetAccountKey'>;

const ASSET_KEY_SEPARATOR = '/';

const NATIVE_COIN_CONTRACT = '';

export const getWalletAssetKey = ({
    deviceState,
    symbol,
    contractAddress,
}: {
    deviceState: StaticSessionId;
    symbol: NetworkSymbol;
    contractAddress?: TokenAddress;
}): WalletAssetKey =>
    `${deviceState}${ASSET_KEY_SEPARATOR}${symbol}${ASSET_KEY_SEPARATOR}${contractAddress ?? NATIVE_COIN_CONTRACT}` as WalletAssetKey;

const getAssetAccountKey = ({
    accountKey,
    contractAddress,
}: {
    accountKey: AccountKey;
    contractAddress: TokenAddress | undefined;
}): AssetAccountKey =>
    `${accountKey}${ASSET_KEY_SEPARATOR}${contractAddress ?? NATIVE_COIN_CONTRACT}` as AssetAccountKey;

export type AssetAccount = {
    assetAccountKey: AssetAccountKey;
    accountKey: AccountKey;
    assetKey: WalletAssetKey;
    deviceState: StaticSessionId;
    symbol: NetworkSymbol;
    contractAddress: TokenAddress | undefined;
    cryptoBalance: string;
    tokenInfo: TokenInfo | undefined;
    isAccountVisible: boolean;
};

const toAssetAccounts = (account: Account): readonly AssetAccount[] => {
    const toAssetAccount = (
        contractAddress: TokenAddress | undefined,
        cryptoBalance: string,
        tokenInfo: TokenInfo | undefined,
    ): AssetAccount => ({
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
        cryptoBalance,
        tokenInfo,
        isAccountVisible: account.visible,
    });

    const tokenAccounts = (account.tokens ?? [])
        .filter(token => !isNftToken(token) && new BigNumber(token.balance ?? '0').gt(0))
        .map(token => toAssetAccount(token.contract as TokenAddress, token.balance ?? '0', token));

    return [toAssetAccount(undefined, account.formattedBalance, undefined), ...tokenAccounts];
};

export type AssetAccountsRootState = AccountsRootState & TokenDefinitionsRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<AssetAccountsRootState>();

export const selectAssetAccounts = createMemoizedSelector([selectAccounts], accounts =>
    returnStableArrayIfEmpty(accounts.flatMap(toAssetAccounts)),
);

export type AssetAccountsByNetwork = ReadonlyMap<NetworkSymbol, readonly AssetAccount[]>;

export const selectAssetAccountsByWallet = createMemoizedSelector(
    [selectAssetAccounts],
    (assetAccounts): ReadonlyMap<StaticSessionId, AssetAccountsByNetwork> => {
        const byWallet = new Map<StaticSessionId, Map<NetworkSymbol, AssetAccount[]>>();

        assetAccounts.forEach(assetAccount => {
            const { deviceState, symbol } = assetAccount;
            let byNetwork = byWallet.get(deviceState);

            if (byNetwork === undefined) {
                byNetwork = new Map<NetworkSymbol, AssetAccount[]>();
                byWallet.set(deviceState, byNetwork);
            }

            const held = byNetwork.get(symbol);

            if (held === undefined) {
                byNetwork.set(symbol, [assetAccount]);
            } else {
                held.push(assetAccount);
            }
        });

        return byWallet;
    },
);

export type AssetAccountsByContract = ReadonlyMap<TokenAddress, readonly AssetAccount[]>;

const selectAssetAccountsByToken = createMemoizedSelector(
    [selectAssetAccounts],
    (assetAccounts): ReadonlyMap<NetworkSymbol, AssetAccountsByContract> => {
        const byNetwork = new Map<NetworkSymbol, Map<TokenAddress, AssetAccount[]>>();

        assetAccounts.forEach(assetAccount => {
            const { symbol, contractAddress } = assetAccount;

            if (contractAddress === undefined) {
                return;
            }

            let byContract = byNetwork.get(symbol);

            if (byContract === undefined) {
                byContract = new Map<TokenAddress, AssetAccount[]>();
                byNetwork.set(symbol, byContract);
            }

            const held = byContract.get(contractAddress);

            if (held === undefined) {
                byContract.set(contractAddress, [assetAccount]);
            } else {
                held.push(assetAccount);
            }
        });

        return byNetwork;
    },
);

export type HiddenTokenReason = 'hiddenByUser' | 'unrecognized';

export const selectHiddenTokenReasons = createMemoizedSelector(
    [selectAssetAccountsByToken, selectTokenDefinitions],
    (
        byNetwork,
        tokenDefinitions,
    ): ReadonlyMap<NetworkSymbol, ReadonlyMap<TokenAddress, HiddenTokenReason>> => {
        const reasons = new Map<NetworkSymbol, Map<TokenAddress, HiddenTokenReason>>();

        byNetwork.forEach((byContract, symbol) => {
            byContract.forEach((group, contractAddress) => {
                const [assetAccount] = group;

                if (assetAccount?.tokenInfo === undefined) {
                    return;
                }

                const { hiddenWithBalance, hiddenWithoutBalance, unverifiedWithBalance } =
                    getTokens({
                        tokens: [assetAccount.tokenInfo],
                        symbol,
                        tokenDefinitions: tokenDefinitions?.[symbol]?.coin,
                    });

                const isHiddenByUser = hiddenWithBalance.length + hiddenWithoutBalance.length > 0;

                if (!isHiddenByUser && unverifiedWithBalance.length === 0) {
                    return;
                }

                const hiddenOnNetwork =
                    reasons.get(symbol) ?? new Map<TokenAddress, HiddenTokenReason>();

                hiddenOnNetwork.set(
                    contractAddress,
                    isHiddenByUser ? 'hiddenByUser' : 'unrecognized',
                );
                reasons.set(symbol, hiddenOnNetwork);
            });
        });

        return reasons;
    },
);

export const selectHiddenAssetAccountKeys = createMemoizedSelector(
    [selectAssetAccountsByToken, selectHiddenTokenReasons],
    (byNetwork, reasons) => {
        const keys: AssetAccountKey[] = [];

        reasons.forEach((hiddenOnNetwork, symbol) => {
            hiddenOnNetwork.forEach((_reason, contractAddress) => {
                byNetwork
                    .get(symbol)
                    ?.get(contractAddress)
                    ?.forEach(assetAccount => keys.push(assetAccount.assetAccountKey));
            });
        });

        return returnStableArrayIfEmpty(keys);
    },
);

export const selectHiddenAssetAccountKeySet = createMemoizedSelector(
    [selectHiddenAssetAccountKeys],
    (keys): ReadonlySet<AssetAccountKey> => new Set(keys),
);
