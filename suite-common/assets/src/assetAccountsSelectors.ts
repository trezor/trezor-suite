import { type DeviceRootState } from '@suite-common/device';
import {
    type StakingRootState,
    selectStakingAmountsOutsideBalance,
} from '@suite-common/earn-staking';
import { type StakingAmount, ZERO_STAKING_AMOUNT } from '@suite-common/earn-staking-common';
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
    selectAccounts,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { getAccountBalanceWithStaking, isNftToken } from '@suite-common/wallet-utils';
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
    networkSymbol: NetworkSymbol;
    contractAddress: TokenAddress | undefined;
    cryptoBalance: string;
    tokenInfo: TokenInfo | undefined;
};

export type AssetAccountsRootState = AccountsRootState &
    DeviceRootState &
    TokenDefinitionsRootState &
    StakingRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<AssetAccountsRootState>();

const createAssetAccount = weakMapMemoize(
    (
        assetAccountKey: AssetAccountKey,
        accountKey: AccountKey,
        assetKey: WalletAssetKey,
        deviceState: StaticSessionId,
        networkSymbol: NetworkSymbol,
        contractAddress: TokenAddress | undefined,
        cryptoBalance: string,
        tokenInfo: TokenInfo | undefined,
    ): AssetAccount => ({
        assetAccountKey,
        accountKey,
        assetKey,
        deviceState,
        networkSymbol,
        contractAddress,
        cryptoBalance,
        tokenInfo,
    }),
    // A native token keys the cache with strings only, one entry per balance ever shown: the bound
    // keeps what is still read and drops stale balances a generation at a time.
    { maxSize: 1000 },
);

const createStableAccountAssetAccounts = weakMapMemoize(
    (...assetAccounts: AssetAccount[]) => assetAccounts,
);

const createStableAssetAccounts = weakMapMemoize(
    (...assetAccounts: AssetAccount[]) => assetAccounts,
);

const getNativeTokenCryptoBalance = (
    account: Account,
    stakingAmountOutsideBalance: StakingAmount,
) => getAccountBalanceWithStaking({ account, stakingBalance: stakingAmountOutsideBalance });

// Keyed on the account object, so an account's asset accounts are rebuilt only when it or its
// staking amount changes, and the cache entry goes with the account.
const toAssetAccounts = weakMapMemoize(
    (account: Account, stakingAmountOutsideBalance: StakingAmount): readonly AssetAccount[] => {
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
                    networkSymbol: account.symbol,
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
            .map(token =>
                toAssetAccount(token.contract as TokenAddress, token.balance ?? '0', token),
            );

        return createStableAccountAssetAccounts(
            toAssetAccount(
                undefined,
                getNativeTokenCryptoBalance(account, stakingAmountOutsideBalance),
                undefined,
            ),
            ...tokenAccounts,
        );
    },
);

// Inputs are the accounts and the staking amounts, never the whole state, so an unrelated update
// does not walk the accounts again.
const toStableAssetAccounts = (
    accounts: readonly Account[],
    amountsOutsideBalance: Partial<Record<AccountKey, StakingAmount>>,
): readonly AssetAccount[] =>
    returnStableArrayIfEmpty(
        createStableAssetAccounts(
            ...accounts.flatMap(account =>
                toAssetAccounts(account, amountsOutsideBalance[account.key] ?? ZERO_STAKING_AMOUNT),
            ),
        ),
    );

export const selectAssetAccounts = createMemoizedSelector(
    [selectAccounts, selectStakingAmountsOutsideBalance],
    toStableAssetAccounts,
);

/** Only the wallet on screen: another wallet's accounts are no work this table has to do. */
export const selectDeviceAssetAccounts = createMemoizedSelector(
    [selectVisibleDeviceAccounts, selectStakingAmountsOutsideBalance],
    toStableAssetAccounts,
);

type AssetAccountsByContract = ReadonlyMap<TokenAddress, readonly AssetAccount[]>;

const selectAssetAccountsByToken = createMemoizedSelector(
    [selectAssetAccounts],
    (assetAccounts): ReadonlyMap<NetworkSymbol, AssetAccountsByContract> => {
        const byNetwork = new Map<NetworkSymbol, Map<TokenAddress, AssetAccount[]>>();

        assetAccounts.forEach(assetAccount => {
            const { networkSymbol, contractAddress } = assetAccount;

            if (contractAddress === undefined) {
                return;
            }

            let byContract = byNetwork.get(networkSymbol);

            if (byContract === undefined) {
                byContract = new Map<TokenAddress, AssetAccount[]>();
                byNetwork.set(networkSymbol, byContract);
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
