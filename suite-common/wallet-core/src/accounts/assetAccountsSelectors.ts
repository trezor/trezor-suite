import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
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
    isCollection: boolean;
};

const toAssetAccounts = (account: Account): readonly AssetAccount[] => {
    const toAssetAccount = (
        contractAddress: TokenAddress | undefined,
        cryptoBalance: string,
        tokenInfo: TokenInfo | undefined,
        isCollection = false,
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
        isCollection,
    });

    const coinAccounts = [toAssetAccount(undefined, account.formattedBalance, undefined)];

    const tokenAccounts = (account.tokens ?? [])
        .filter(token => new BigNumber(token.balance ?? '0').gt(0))
        .map(token =>
            toAssetAccount(
                token.contract as TokenAddress,
                token.balance ?? '0',
                token,
                isNftCollection(token),
            ),
        );

    return [...coinAccounts, ...tokenAccounts];
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
            const { isCollection, deviceState, symbol } = assetAccount;

            if (isCollection) {
                return;
            }

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
            const { isCollection, symbol, contractAddress } = assetAccount;

            if (isCollection || contractAddress === undefined) {
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

export const selectCollectionsByDevice = createMemoizedSelector(
    [selectAssetAccounts],
    (assetAccounts): ReadonlyMap<StaticSessionId, readonly AssetAccount[]> => {
        const byWallet = new Map<StaticSessionId, AssetAccount[]>();

        assetAccounts.forEach(assetAccount => {
            if (!assetAccount.isCollection) {
                return;
            }

            const held = byWallet.get(assetAccount.deviceState);

            if (held === undefined) {
                byWallet.set(assetAccount.deviceState, [assetAccount]);
            } else {
                held.push(assetAccount);
            }
        });

        return byWallet;
    },
);

export const selectDeviceAssetGroups = createMemoizedSelector(
    [
        selectAssetAccountsByWallet,
        (_state: AssetAccountsRootState, deviceState: StaticSessionId) => deviceState,
        (
            _state: AssetAccountsRootState,
            _deviceState: StaticSessionId,
            symbols: readonly NetworkSymbol[],
        ) => symbols,
    ],
    (byWallet, deviceState, symbols): readonly (readonly AssetAccount[])[] => {
        const groups = new Map<WalletAssetKey, AssetAccount[]>();
        const byNetwork = byWallet.get(deviceState);

        symbols.forEach(symbol => {
            const held = byNetwork?.get(symbol);

            held?.forEach(assetAccount => {
                const group = groups.get(assetAccount.assetKey);

                if (group === undefined) {
                    groups.set(assetAccount.assetKey, [assetAccount]);
                } else {
                    group.push(assetAccount);
                }
            });
        });

        return returnStableArrayIfEmpty([...groups.values()]);
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
                        areCollectionsRecognisedByIds: true,
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
