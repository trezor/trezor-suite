import { type DeviceRootState } from '@suite-common/device';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import {
    type NetworkSymbol,
    getNetworkDisplaySymbol,
    getNetworkDisplaySymbolName,
} from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    getAccountCryptoBalanceWithStaking,
    selectVisibleDeviceAccountsByNetworkSymbol,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

export type AssetsRootState = AccountsRootState & DeviceRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<AssetsRootState>();

type AssetAccountBalanceEntry = {
    accountKey: AccountKey;
    accountLabel?: string;
    cryptoBalance: string;
};

export const selectAssetAccountBalances = createMemoizedSelector(
    [
        selectVisibleDeviceAccountsByNetworkSymbol,
        (_state: AssetsRootState, _networkSymbol: NetworkSymbol, tokenContract?: TokenAddress) =>
            tokenContract,
    ],
    (accounts, tokenContract): AssetAccountBalanceEntry[] => {
        if (!tokenContract) {
            return accounts.map(account => ({
                accountKey: account.key,
                accountLabel: account.accountLabel,
                cryptoBalance: getAccountCryptoBalanceWithStaking(account),
            }));
        }

        const normalizedTokenContract = tokenContract.toLowerCase();

        return accounts.reduce<AssetAccountBalanceEntry[]>((accountBalances, account) => {
            for (const token of account.tokens ?? []) {
                if (token.contract.toLowerCase() === normalizedTokenContract) {
                    accountBalances.push({
                        accountKey: account.key,
                        accountLabel: account.accountLabel,
                        cryptoBalance: token.balance ?? '0',
                    });

                    break;
                }
            }

            return accountBalances;
        }, []);
    },
);

const selectAssetBalanceBreakdown = createMemoizedSelector(
    [selectVisibleDeviceAccountsByNetworkSymbol],
    accounts => {
        const availableBalance = accounts.reduce(
            (balance, account) => balance.plus(account.formattedBalance),
            new BigNumber(0),
        );
        const totalBalance = accounts.reduce(
            (balance, account) => balance.plus(getAccountCryptoBalanceWithStaking(account)),
            new BigNumber(0),
        );

        const stakingBalance = BigNumber.max(totalBalance.minus(availableBalance), 0);

        return {
            availableBalance: availableBalance.toFixed(),
            stakingBalance: stakingBalance.toFixed(),
            hasStakingBalance: stakingBalance.gt(0),
        };
    },
);

export const selectAssetAvailableCryptoBalance = createMemoizedSelector(
    [selectAssetBalanceBreakdown],
    ({ availableBalance }) => availableBalance,
);

export const selectAssetStakingCryptoBalance = createMemoizedSelector(
    [selectAssetBalanceBreakdown],
    ({ stakingBalance }) => stakingBalance,
);

export const selectAssetHasStakingBalance = createMemoizedSelector(
    [selectAssetBalanceBreakdown],
    ({ hasStakingBalance }) => hasStakingBalance,
);

export const selectAssetTokenInfo = createMemoizedSelector(
    [
        selectVisibleDeviceAccountsByNetworkSymbol,
        (_state: AssetsRootState, _networkSymbol: NetworkSymbol, tokenContract?: TokenAddress) =>
            tokenContract,
    ],
    (accounts, tokenContract) => {
        if (!tokenContract) return null;

        const lowerCaseTokenContract = tokenContract.toLowerCase();

        for (const account of accounts) {
            const token = account.tokens?.find(
                accountToken => accountToken.contract.toLowerCase() === lowerCaseTokenContract,
            );

            if (token) return token;
        }

        return null;
    },
);

export const selectAssetTicker = createMemoizedSelector(
    [
        selectAssetTokenInfo,
        (_state: AssetsRootState, networkSymbol: NetworkSymbol) => networkSymbol,
    ],
    (token, networkSymbol) =>
        token?.symbol ?? token?.name ?? getNetworkDisplaySymbol(networkSymbol),
);

export const selectAssetName = createMemoizedSelector(
    [
        selectAssetTokenInfo,
        (_state: AssetsRootState, networkSymbol: NetworkSymbol) => networkSymbol,
    ],
    (token, networkSymbol) =>
        token?.name ?? token?.symbol ?? getNetworkDisplaySymbolName(networkSymbol),
);
