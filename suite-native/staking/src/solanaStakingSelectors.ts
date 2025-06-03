import { createWeakMapSelector } from '@suite-common/redux-utils';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    StakeRootState,
    selectAccountByKey,
    selectAccountNetworkSymbol,
    selectDeviceAccounts,
    selectPoolStatsApyData,
} from '@suite-common/wallet-core';
import {
    calculateSolanaStakingReward,
    getSolStakingAccountsInfo,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { NativeStakingRootState } from './types';

export const createMemoizedSelector = createWeakMapSelector.withTypes<NativeStakingRootState>();

export const selectVisibleDeviceSolanaAccountsWithStakingByNetworkSymbol = createMemoizedSelector(
    [selectDeviceAccounts, (_state, symbol: NetworkSymbol) => symbol],
    (accounts, symbol) =>
        accounts.filter(
            account =>
                account.symbol === symbol &&
                account.visible &&
                account.networkType === 'solana' &&
                !!account.misc?.solStakingAccounts?.length,
        ),
);

export const selectSolStakingAccountsInfoByAccountKey = createMemoizedSelector(
    [selectAccountByKey],
    account => {
        if (!account) {
            return null;
        }

        return getSolStakingAccountsInfo(account);
    },
);

export const selectSolanaIsStakePendingByAccountKey = (
    state: AccountsRootState,
    accountKey: string,
) => {
    const stakingInfo = selectSolStakingAccountsInfoByAccountKey(state, accountKey);

    if (!stakingInfo) {
        return false;
    }

    return Number(stakingInfo?.solPendingStakeBalance ?? 0) > 0;
};

export const selectSolanaAPYByAccountKey = (
    state: StakeRootState & AccountsRootState,
    accountKey: string,
) => {
    const symbol = selectAccountNetworkSymbol(state, accountKey);
    if (!symbol) return 0;

    return selectPoolStatsApyData(state, symbol);
};

export const selectSolanaStakedBalanceByAccountKey = (
    state: AccountsRootState,
    accountKey: string,
) => {
    const stakingInfo = selectSolStakingAccountsInfoByAccountKey(state, accountKey);
    if (!stakingInfo) {
        return '0';
    }

    return new BigNumber(stakingInfo.solStakedBalance)
        .plus(stakingInfo.solPendingUnstakeBalance)
        .toString();
};

export const selectExpectedRewardsForEpoch = (
    state: StakeRootState & AccountsRootState,
    accountKey: string,
) => {
    const stakingInfo = selectSolStakingAccountsInfoByAccountKey(state, accountKey);
    const apy = selectSolanaAPYByAccountKey(state, accountKey).toString();

    if (!stakingInfo) {
        return '0';
    }

    const yieldBearingBalance = new BigNumber(stakingInfo.solStakedBalance)
        .plus(stakingInfo.solPendingUnstakeBalance)
        .toString();

    return calculateSolanaStakingReward(yieldBearingBalance, apy);
};

export const selectSolanaTotalStakePendingByAccountKey = (
    state: AccountsRootState,
    accountKey: string,
) => {
    const stakingInfo = selectSolStakingAccountsInfoByAccountKey(state, accountKey);
    if (!stakingInfo) {
        return '0';
    }

    return stakingInfo.solPendingStakeBalance;
};

export const selectSolanaClaimableAmountByAccountKey = (
    state: AccountsRootState,
    accountKey: string,
) => {
    const stakingInfo = selectSolStakingAccountsInfoByAccountKey(state, accountKey);
    if (!stakingInfo) {
        return '0';
    }

    return stakingInfo.solClaimableBalance;
};

export const selectSolanaCanClaimByAccountKey = (state: AccountsRootState, accountKey: string) => {
    const stakingInfo = selectSolStakingAccountsInfoByAccountKey(state, accountKey);
    if (!stakingInfo) {
        return false;
    }

    return stakingInfo.canClaimSol;
};
