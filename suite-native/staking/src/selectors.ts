import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import {
    getEthereumCryptoBalanceWithStaking,
    getSolanaCryptoBalanceWithStaking,
    getTronCryptoBalanceWithStaking,
    getUnstakingPeriodInDays,
    selectAccountByKey,
    selectAdaAccountHasStaked,
    selectEthValidatorsQueue,
    selectPoolStatsApy,
    selectSolAccountHasStaked,
} from '@suite-common/wallet-core';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { isStakingSymbol, toStakingNetworkSymbol } from '@suite-common/wallet-utils';
import { SOLANA_EPOCH_DAYS } from '@trezor/network-solana/constants';
import { exhaustive } from '@trezor/type-utils';

import {
    selectCardanoRewardsBalanceByAccountKey,
    selectCardanoStakedBalanceByAccountKey,
    selectVisibleDeviceCardanoAccountsWithStakingByNetworkSymbol,
} from './cardanoStakingSelectors';
import {
    selectEthereumAccountHasStaking,
    selectEthereumCanClaimByAccountKey,
    selectEthereumClaimableAmountByAccountKey,
    selectEthereumEntryPeriodInDays,
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
import {
    selectTronAccountHasStaked,
    selectTronRewardsBalanceByAccountKey,
    selectTronStakedBalanceByAccountKey,
    selectTronUnstakedBalanceByAccountKey,
    selectVisibleDeviceTronAccountsWithStakingByNetworkSymbol,
} from './tronStakingSelectors';
import { type NativeStakingRootState } from './types';

// create empty array in advance so it will be always same on shallow comparison
const EMPTY_ACCOUNT_ARRAY: Account[] = [];
const ethSymbol = asNetworkSymbol('eth');
const solSymbol = asNetworkSymbol('sol');
const adaSymbol = asNetworkSymbol('ada');
const trxSymbol = asNetworkSymbol('trx');

const selectDeviceAccountsWithStaking = (
    state: NativeStakingRootState,
    symbol: NetworkSymbol,
): Account[] => {
    const stakingSymbol = toStakingNetworkSymbol(symbol);
    if (stakingSymbol === null) {
        return EMPTY_ACCOUNT_ARRAY;
    }

    switch (stakingSymbol) {
        case 'eth':
        case 'thod':
            return selectVisibleDeviceEthereumAccountsWithStakingByNetworkSymbol(state, ethSymbol);
        case 'dsol':
        case 'sol':
            return selectVisibleDeviceSolanaAccountsWithStakingByNetworkSymbol(state, solSymbol);
        case 'ada':
            return selectVisibleDeviceCardanoAccountsWithStakingByNetworkSymbol(state, adaSymbol);
        case 'trx':
            return selectVisibleDeviceTronAccountsWithStakingByNetworkSymbol(state, trxSymbol);
        default:
            return exhaustive(stakingSymbol);
    }
};

export const selectHasAnyDeviceAccountsWithStaking = (
    state: NativeStakingRootState,
    symbol: NetworkSymbol,
) => selectDeviceAccountsWithStaking(state, symbol).length > 0;

export const getAccountCryptoBalanceWithStaking = (account: Account | null) => {
    if (!account) return '0';

    const stakingSymbol = toStakingNetworkSymbol(account.symbol);
    if (stakingSymbol === null) {
        return account.formattedBalance;
    }

    switch (stakingSymbol) {
        case 'eth':
        case 'thod':
            return getEthereumCryptoBalanceWithStaking(account);
        case 'dsol':
        case 'sol':
            return getSolanaCryptoBalanceWithStaking(account);
        case 'ada':
            return account.formattedBalance;
        case 'trx':
            return getTronCryptoBalanceWithStaking(account);
        default:
            return exhaustive(stakingSymbol);
    }
};

export const selectAccountHasStaking = (state: NativeStakingRootState, accountKey: AccountKey) => {
    const account = selectAccountByKey(state, accountKey);
    const stakingSymbol = account ? toStakingNetworkSymbol(account.symbol) : null;

    if (stakingSymbol === null) {
        return false;
    }

    switch (stakingSymbol) {
        case 'eth':
        case 'thod':
            return selectEthereumAccountHasStaking(state, accountKey);
        case 'dsol':
        case 'sol':
            return selectSolAccountHasStaked(state, accountKey);
        case 'ada':
            return selectAdaAccountHasStaked(state, accountKey);
        case 'trx':
            return selectTronAccountHasStaked(state, accountKey);
        default:
            return exhaustive(stakingSymbol);
    }
};

export const selectIsStakePendingByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey | null,
) => {
    const account = selectAccountByKey(state, accountKey);
    const stakingSymbol = account ? toStakingNetworkSymbol(account.symbol) : null;
    if (stakingSymbol === null || !accountKey) {
        return false;
    }

    switch (stakingSymbol) {
        case 'eth':
        case 'thod':
            return selectEthereumIsStakePendingByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            return selectSolanaIsStakePendingByAccountKey(state, accountKey);
        case 'ada':
            return false;
        case 'trx':
            return false;
        default:
            return exhaustive(stakingSymbol);
    }
};

export const selectIsStakeConfirmingByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const stakingSymbol = account ? toStakingNetworkSymbol(account.symbol) : null;
    if (stakingSymbol === null) {
        return false;
    }

    switch (stakingSymbol) {
        case 'eth':
        case 'thod':
            return selectEthereumIsStakeConfirmingByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            return false; // there are no pending txns for solana staking;
        case 'ada':
            return false;
        case 'trx':
            return false;
        default:
            return exhaustive(stakingSymbol);
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
    const stakingSymbol = account ? toStakingNetworkSymbol(account.symbol) : null;
    if (stakingSymbol === null) {
        return '0';
    }

    switch (stakingSymbol) {
        case 'eth':
        case 'thod':
            return selectEthereumStakedBalanceByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            return selectSolanaStakedBalanceByAccountKey(state, accountKey);
        case 'ada':
            return selectCardanoStakedBalanceByAccountKey(state, accountKey);
        case 'trx':
            return selectTronStakedBalanceByAccountKey(state, accountKey);
        default:
            return exhaustive(stakingSymbol);
    }
};

export const selectRewardsBalanceByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey | null,
) => {
    const account = selectAccountByKey(state, accountKey);
    const stakingSymbol = account ? toStakingNetworkSymbol(account.symbol) : null;
    if (stakingSymbol === null || !accountKey) {
        return '0';
    }

    switch (stakingSymbol) {
        case 'eth':
        case 'thod':
            return selectEthereumRewardsBalanceByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            // on solana we show rewards per one epoch
            return selectExpectedRewardsForEpoch(state, accountKey);
        case 'ada':
            return selectCardanoRewardsBalanceByAccountKey(state, accountKey);
        case 'trx':
            return selectTronRewardsBalanceByAccountKey(state, accountKey);
        default:
            return exhaustive(stakingSymbol);
    }
};

export const selectTotalStakePendingByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey | null,
) => {
    const account = selectAccountByKey(state, accountKey);
    const stakingSymbol = account ? toStakingNetworkSymbol(account.symbol) : null;
    if (stakingSymbol === null || !accountKey) {
        return '0';
    }

    switch (stakingSymbol) {
        case 'eth':
        case 'thod':
            return selectEthereumTotalStakePendingByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            return selectSolanaTotalStakePendingByAccountKey(state, accountKey);
        case 'ada':
            return '0';
        case 'trx':
            return '0';
        default:
            return exhaustive(stakingSymbol);
    }
};

export const selectClaimableAmountByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const stakingSymbol = account ? toStakingNetworkSymbol(account.symbol) : null;
    if (stakingSymbol === null) {
        return '0';
    }

    switch (stakingSymbol) {
        case 'eth':
        case 'thod':
            return selectEthereumClaimableAmountByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            return selectSolanaClaimableAmountByAccountKey(state, accountKey);
        case 'ada':
            return '0';
        case 'trx':
            return '0';
        default:
            return exhaustive(stakingSymbol);
    }
};

export const selectCanClaimByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const stakingSymbol = account ? toStakingNetworkSymbol(account.symbol) : null;
    if (stakingSymbol === null) {
        return false;
    }

    switch (stakingSymbol) {
        case 'eth':
        case 'thod':
            return selectEthereumCanClaimByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            return selectSolanaCanClaimByAccountKey(state, accountKey);
        case 'ada':
            return false;
        case 'trx':
            return false;
        default:
            return exhaustive(stakingSymbol);
    }
};

export const selectUnstakingBalanceByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const stakingSymbol = account ? toStakingNetworkSymbol(account.symbol) : null;
    if (stakingSymbol === null) {
        return '0';
    }

    switch (stakingSymbol) {
        case 'eth':
        case 'thod':
            return selectEthereumUnstakingBalanceByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            return selectSolanaUnstakingBalanceByAccountKey(state, accountKey);
        case 'ada':
            return '0';
        case 'trx':
            return selectTronUnstakedBalanceByAccountKey(state, accountKey);
        default:
            return exhaustive(stakingSymbol);
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

export const selectEntryPeriodInDaysBySymbol = (
    state: NativeStakingRootState,
    symbol: NetworkSymbol | undefined,
) => {
    const stakingSymbol = symbol ? toStakingNetworkSymbol(symbol) : null;
    if (stakingSymbol === null) {
        return undefined;
    }

    switch (stakingSymbol) {
        case 'eth':
        case 'thod':
            return selectEthereumEntryPeriodInDays(state);
        case 'dsol':
        case 'sol':
            return SOLANA_EPOCH_DAYS;
        case 'ada':
            return undefined;
        case 'trx':
            return undefined;
        default:
            return exhaustive(stakingSymbol);
    }
};

export { selectUnstakingPeriodInDaysBySymbol };
