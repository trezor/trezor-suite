import { createWeakMapSelector } from '@suite-common/redux-utils';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type StakeRootState,
    selectAccountByKey,
    selectDeviceAccounts,
    selectPoolStatsApy,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    calculateSolanaStakingReward,
    getSolStakingAccountsInfo,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { type NativeStakingRootState } from './types';

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
    accountKey: AccountKey,
) => {
    const stakingInfo = selectSolStakingAccountsInfoByAccountKey(state, accountKey);

    if (!stakingInfo) {
        return false;
    }

    return Number(stakingInfo?.solPendingStakeBalance ?? 0) > 0;
};

export const selectSolanaAPYByAccountKey = (
    state: StakeRootState & AccountsRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    if (!account) return 0;

    return selectPoolStatsApy(state, { account });
};

export const selectSolanaStakedBalanceByAccountKey = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => {
    const stakingInfo = selectSolStakingAccountsInfoByAccountKey(state, accountKey);
    if (!stakingInfo) {
        return '0';
    }

    return new BigNumber(stakingInfo.solStakedBalance ?? '0')
        .plus(stakingInfo.solPendingUnstakeBalance ?? '0')
        .toString();
};

export const selectExpectedRewardsForEpoch = (
    state: StakeRootState & AccountsRootState,
    accountKey: AccountKey,
) => {
    const stakingInfo = selectSolStakingAccountsInfoByAccountKey(state, accountKey);
    const apy = selectSolanaAPYByAccountKey(state, accountKey)?.toString();

    if (!stakingInfo || !apy) {
        return '0';
    }

    const yieldBearingBalance = new BigNumber(stakingInfo.solStakedBalance ?? '0')
        .plus(stakingInfo.solPendingUnstakeBalance ?? '0')
        .toString();

    return calculateSolanaStakingReward(yieldBearingBalance, apy);
};

export const selectSolanaTotalStakePendingByAccountKey = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => {
    const stakingInfo = selectSolStakingAccountsInfoByAccountKey(state, accountKey);
    if (!stakingInfo) {
        return '0';
    }

    return stakingInfo.solPendingStakeBalance;
};

export const selectSolanaClaimableAmountByAccountKey = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => {
    const stakingInfo = selectSolStakingAccountsInfoByAccountKey(state, accountKey);
    if (!stakingInfo) {
        return '0';
    }

    return stakingInfo.solClaimableBalance;
};

export const selectSolanaCanClaimByAccountKey = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => {
    const stakingInfo = selectSolStakingAccountsInfoByAccountKey(state, accountKey);
    if (!stakingInfo) {
        return false;
    }

    return stakingInfo.canClaimSol;
};

export const selectSolanaUnstakingBalanceByAccountKey = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => {
    const stakingInfo = selectSolStakingAccountsInfoByAccountKey(state, accountKey);
    if (!stakingInfo) {
        return '0';
    }

    return stakingInfo.solPendingUnstakeBalance;
};
