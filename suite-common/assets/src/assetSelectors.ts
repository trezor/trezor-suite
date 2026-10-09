import { type DeviceRootState } from '@suite-common/device';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import {
    type NetworkSymbol,
    getAssetName,
    getNetworkDisplaySymbol,
} from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    getAccountCryptoBalanceWithStaking,
    selectVisibleDeviceAccountsByNetworkSymbol,
} from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

export type AssetsRootState = AccountsRootState & DeviceRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<AssetsRootState>();

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
        getAssetName({
            symbol: networkSymbol,
            tokenName: token?.name,
            tokenSymbol: token?.symbol,
        }),
);
