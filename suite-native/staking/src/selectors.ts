import type { NetworkSymbol } from '@suite-common/wallet-config';
import {
    selectAccountByKey,
    selectAdaAccountHasStaked,
    selectEthValidatorsQueue,
    selectPoolStatsApy,
    selectSolAccountHasStaked,
} from '@suite-common/wallet-core';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import {
    getEthereumCryptoBalanceWithStaking,
    getSolanaCryptoBalanceWithStaking,
    getUnstakingPeriodInDays,
    isStakingSymbol,
} from '@suite-common/wallet-utils';
import { exhaustive } from '@trezor/type-utils';

import {
    selectCardanoRewardsBalanceByAccountKey,
    selectCardanoStakedBalanceByAccountKey,
    selectCardanoTotalStakePendingByAccountKey,
    selectVisibleDeviceCardanoAccountsWithStakingByNetworkSymbol,
} from './cardanoStakingSelectors';
import {
    selectEntryPeriodInDaysBySymbol,
    selectEntryPeriodRemainingInDaysByAccountKey,
    selectEthereumAccountHasStaking,
    selectEthereumCanClaimByAccountKey,
    selectEthereumClaimableAmountByAccountKey,
    selectEthereumIsStakeConfirmingByAccountKey,
    selectEthereumIsStakePendingByAccountKey,
    selectEthereumRewardsBalanceByAccountKey,
    selectEthereumStakedBalanceByAccountKey,
    selectEthereumTotalStakePendingByAccountKey,
    selectEthereumUnstakingBalanceByAccountKey,
    selectUnstakingPeriodInDaysBySymbol,
    selectVisibleDeviceEthereumAccountsWithStakingByNetworkSymbol,
} from './ethereumStakingSelectors';
import {
    selectExpectedRewardsForEpoch,
    selectSolanaCanClaimByAccountKey,
    selectSolanaClaimableAmountByAccountKey,
    selectSolanaIsStakePendingByAccountKey,
    selectSolanaStakedBalanceByAccountKey,
    selectSolanaTotalStakePendingByAccountKey,
    selectSolanaUnstakingBalanceByAccountKey,
    selectVisibleDeviceSolanaAccountsWithStakingByNetworkSymbol,
} from './solanaStakingSelectors';
import { type NativeStakingRootState } from './types';

// create empty array in advance so it will be always same on shallow comparison
const EMPTY_ACCOUNT_ARRAY: Account[] = [];

export const selectDeviceAccountsWithStaking = (
    state: NativeStakingRootState,
    symbol: NetworkSymbol,
): Account[] => {
    if (!isStakingSymbol(symbol)) {
        return EMPTY_ACCOUNT_ARRAY;
    }

    switch (symbol) {
        case 'eth':
        case 'thod':
            return selectVisibleDeviceEthereumAccountsWithStakingByNetworkSymbol(state, 'eth');
        case 'dsol':
        case 'sol':
            return selectVisibleDeviceSolanaAccountsWithStakingByNetworkSymbol(state, 'sol');
        case 'ada':
            return selectVisibleDeviceCardanoAccountsWithStakingByNetworkSymbol(state, 'ada');
        default:
            return exhaustive(symbol);
    }
};

export const selectHasAnyDeviceAccountsWithStaking = (
    state: NativeStakingRootState,
    symbol: NetworkSymbol,
) => selectDeviceAccountsWithStaking(state, symbol).length > 0;

export const getAccountCryptoBalanceWithStaking = (account: Account | null) => {
    if (!account) return '0';

    if (!isStakingSymbol(account.symbol)) {
        return account.formattedBalance;
    }

    switch (account.symbol) {
        case 'eth':
        case 'thod':
            return getEthereumCryptoBalanceWithStaking(account);
        case 'dsol':
        case 'sol':
            return getSolanaCryptoBalanceWithStaking(account);
        case 'ada':
            return account.formattedBalance;
        default:
            return exhaustive(account.symbol);
    }
};

export const selectAccountCryptoBalanceWithStaking = (
    state: NativeStakingRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);

    return getAccountCryptoBalanceWithStaking(account);
};

export const selectAccountHasStaking = (state: NativeStakingRootState, accountKey: AccountKey) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;

    if (!symbol || !isStakingSymbol(symbol)) {
        return false;
    }

    switch (symbol) {
        case 'eth':
        case 'thod':
            return selectEthereumAccountHasStaking(state, accountKey);
        case 'dsol':
        case 'sol':
            return selectSolAccountHasStaked(state, accountKey);
        case 'ada':
            return selectAdaAccountHasStaked(state, accountKey);
        default:
            return exhaustive(symbol);
    }
};

export const selectIsStakePendingByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey | null,
) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;
    if (!symbol || !isStakingSymbol(symbol) || !accountKey) {
        return false;
    }

    switch (symbol) {
        case 'eth':
        case 'thod':
            return selectEthereumIsStakePendingByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            return selectSolanaIsStakePendingByAccountKey(state, accountKey);
        case 'ada':
            return false;
        default:
            return exhaustive(symbol);
    }
};

export const selectIsStakeConfirmingByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;
    if (!symbol || !isStakingSymbol(symbol)) {
        return false;
    }

    switch (symbol) {
        case 'eth':
        case 'thod':
            return selectEthereumIsStakeConfirmingByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            return false; // there are no pending txns for solana staking;
        case 'ada':
            return false;
        default:
            return exhaustive(symbol);
    }
};

export const selectApy = (
    state: NativeStakingRootState,
    { accountKey, networkSymbol }: { accountKey?: AccountKey; networkSymbol?: NetworkSymbol },
) => {
    const account = selectAccountByKey(state, accountKey) ?? undefined;

    return selectPoolStatsApy(state, { account, networkSymbol });
};

export const selectStakedBalanceByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;
    if (!symbol || !isStakingSymbol(symbol)) {
        return '0';
    }

    switch (symbol) {
        case 'eth':
        case 'thod':
            return selectEthereumStakedBalanceByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            return selectSolanaStakedBalanceByAccountKey(state, accountKey);
        case 'ada':
            return selectCardanoStakedBalanceByAccountKey(state, accountKey);
        default:
            return exhaustive(symbol);
    }
};

export const selectRewardsBalanceByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey | null,
) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;
    if (!symbol || !isStakingSymbol(symbol) || !accountKey) {
        return '0';
    }

    switch (symbol) {
        case 'eth':
        case 'thod':
            return selectEthereumRewardsBalanceByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            // on solana we show rewards per one epoch
            return selectExpectedRewardsForEpoch(state, accountKey);
        case 'ada':
            return selectCardanoRewardsBalanceByAccountKey(state, accountKey);
        default:
            return exhaustive(symbol);
    }
};

export const selectTotalStakePendingByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey | null,
) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;
    if (!symbol || !isStakingSymbol(symbol) || !accountKey) {
        return '0';
    }

    switch (symbol) {
        case 'eth':
        case 'thod':
            return selectEthereumTotalStakePendingByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            return selectSolanaTotalStakePendingByAccountKey(state, accountKey);
        case 'ada':
            return selectCardanoTotalStakePendingByAccountKey(state, accountKey);
        default:
            return exhaustive(symbol);
    }
};

export const selectClaimableAmountByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;
    if (!symbol || !isStakingSymbol(symbol)) {
        return '0';
    }

    switch (symbol) {
        case 'eth':
        case 'thod':
            return selectEthereumClaimableAmountByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            return selectSolanaClaimableAmountByAccountKey(state, accountKey);
        case 'ada':
            return '0';
        default:
            return exhaustive(symbol);
    }
};

export const selectCanClaimByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;
    if (!symbol || !isStakingSymbol(symbol)) {
        return false;
    }

    switch (symbol) {
        case 'eth':
        case 'thod':
            return selectEthereumCanClaimByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            return selectSolanaCanClaimByAccountKey(state, accountKey);
        case 'ada':
            return false;
        default:
            return exhaustive(symbol);
    }
};

export const selectUnstakingBalanceByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;
    if (!symbol || !isStakingSymbol(symbol)) {
        return '0';
    }

    switch (symbol) {
        case 'eth':
        case 'thod':
            return selectEthereumUnstakingBalanceByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            return selectSolanaUnstakingBalanceByAccountKey(state, accountKey);
        case 'ada':
            return '0';
        default:
            return exhaustive(symbol);
    }
};

export const selectUnstakingPeriodInDaysByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    if (!account || !isStakingSymbol(account.symbol)) return null;

    const validatorsQueueData = selectEthValidatorsQueue(state);

    return getUnstakingPeriodInDays(account.networkType, validatorsQueueData);
};

export {
    selectEntryPeriodInDaysBySymbol,
    selectEntryPeriodRemainingInDaysByAccountKey,
    selectUnstakingPeriodInDaysBySymbol,
};
