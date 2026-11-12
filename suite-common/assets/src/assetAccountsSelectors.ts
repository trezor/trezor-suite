import { type DeviceRootState } from '@suite-common/device';
import {
    type StakingRootState,
    formatStakingAmount,
    selectStakingAccountAmountOutsideBalance,
} from '@suite-common/earn-staking';
import { type StakingAmount } from '@suite-common/earn-staking-common';
import {
    type TokenDefinitionsRootState,
    selectTokenDefinitions,
} from '@suite-common/token-definitions';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type AssetAccountKey,
    type WalletAssetKey,
    getAssetAccountKey,
    getTokens,
    getWalletAssetKey,
    selectAccountByKey,
    selectAccounts,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { isNftToken } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { type StaticSessionId } from '@trezor/device-utils';
import {
    createWeakMapSelector,
    returnStableArrayIfEmpty,
    weakMapMemoize,
} from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

export type AssetAccount = {
    assetAccountKey: AssetAccountKey;
    accountKey: AccountKey;
    assetKey: WalletAssetKey;
    deviceState: StaticSessionId;
    symbol: NetworkSymbol;
    contractAddress: TokenAddress | undefined;
    cryptoBalance: string;
    tokenInfo: TokenInfo | undefined;
};

export type AssetAccountsRootState = AccountsRootState &
    DeviceRootState &
    TokenDefinitionsRootState &
    StakingRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<AssetAccountsRootState>();

const selectState = (state: AssetAccountsRootState) => state;

const createAssetAccount = weakMapMemoize(
    (
        assetAccountKey: AssetAccountKey,
        accountKey: AccountKey,
        assetKey: WalletAssetKey,
        deviceState: StaticSessionId,
        symbol: NetworkSymbol,
        contractAddress: TokenAddress | undefined,
        cryptoBalance: string,
        tokenInfo: TokenInfo | undefined,
    ): AssetAccount => ({
        assetAccountKey,
        accountKey,
        assetKey,
        deviceState,
        symbol,
        contractAddress,
        cryptoBalance,
        tokenInfo,
    }),
);

const createStableAccountAssetAccounts = weakMapMemoize(
    (...assetAccounts: AssetAccount[]) => assetAccounts,
);

const createStableAssetAccounts = weakMapMemoize(
    (...assetAccounts: AssetAccount[]) => assetAccounts,
);

const getCoinCryptoBalance = (account: Account, stakingAmountOutsideBalance: StakingAmount) => {
    if (new BigNumber(stakingAmountOutsideBalance).isZero()) {
        return account.formattedBalance;
    }

    return new BigNumber(account.formattedBalance)
        .plus(
            formatStakingAmount({
                amount: stakingAmountOutsideBalance,
                networkSymbol: account.symbol,
            }),
        )
        .toFixed();
};

const toAssetAccounts = (
    account: Account,
    stakingAmountOutsideBalance: StakingAmount,
): readonly AssetAccount[] => {
    const toAssetAccount = (
        contractAddress: TokenAddress | undefined,
        cryptoBalance: string,
        tokenInfo: TokenInfo | undefined,
    ) =>
        createAssetAccount(
            getAssetAccountKey({ accountKey: account.key, contractAddress }),
            account.key,
            getWalletAssetKey({
                deviceState: account.deviceState,
                symbol: account.symbol,
                contractAddress,
            }),
            account.deviceState,
            account.symbol,
            contractAddress,
            cryptoBalance,
            tokenInfo,
        );

    const tokenAccounts = (account.tokens ?? [])
        .filter(token => !isNftToken(token) && new BigNumber(token.balance ?? '0').gt(0))
        .map(token => toAssetAccount(token.contract as TokenAddress, token.balance ?? '0', token));

    return createStableAccountAssetAccounts(
        toAssetAccount(
            undefined,
            getCoinCryptoBalance(account, stakingAmountOutsideBalance),
            undefined,
        ),
        ...tokenAccounts,
    );
};

const selectAccountAssetAccounts = createMemoizedSelector(
    [selectAccountByKey, selectStakingAccountAmountOutsideBalance],
    (account, stakingAmountOutsideBalance): readonly AssetAccount[] =>
        account === null
            ? returnStableArrayIfEmpty([])
            : toAssetAccounts(account, stakingAmountOutsideBalance),
);

const toStableAssetAccounts = (
    state: AssetAccountsRootState,
    accounts: readonly Account[],
): readonly AssetAccount[] =>
    returnStableArrayIfEmpty(
        createStableAssetAccounts(
            ...accounts.flatMap(account => selectAccountAssetAccounts(state, account.key)),
        ),
    );

export const selectAssetAccounts = createMemoizedSelector(
    [selectState, selectAccounts],
    toStableAssetAccounts,
);

/** Only the wallet on screen: another wallet's accounts are no work this table has to do. */
export const selectDeviceAssetAccounts = createMemoizedSelector(
    [selectState, selectVisibleDeviceAccounts],
    toStableAssetAccounts,
);

type AssetAccountsByContract = ReadonlyMap<TokenAddress, readonly AssetAccount[]>;

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
