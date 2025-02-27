import { UnreachableCaseError } from '@suite-common/suite-utils';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import {
    selectAccountByKey,
    selectPoolStatsApyData,
    selectSolAccountHasStaked,
} from '@suite-common/wallet-core';
import { Account, AccountKey } from '@suite-common/wallet-types';
import {
    getEthereumCryptoBalanceWithStaking,
    getSolanaCryptoBalanceWithStaking,
} from '@suite-common/wallet-utils';

import {
    selectEthereumAccountHasStaking,
    selectEthereumIsStakeConfirmingByAccountKey,
    selectEthereumIsStakePendingByAccountKey,
    selectEthereumRewardsBalanceByAccountKey,
    selectEthereumStakedBalanceByAccountKey,
    selectEthereumTotalStakePendingByAccountKey,
    selectVisibleDeviceEthereumAccountsWithStakingByNetworkSymbol,
} from './ethereumStakingSelectors';
import {
    selectExpectedRewardsForEpoch,
    selectSolanaIsStakePendingByAccountKey,
    selectSolanaStakedBalanceByAccountKey,
    selectSolanaTotalStakePendingByAccountKey,
    selectVisibleDeviceSolanaAccountsWithStakingByNetworkSymbol,
} from './solanaStakingSelectors';
import { NativeStakingRootState } from './types';
import { doesCoinSupportStaking } from './utils';

// create empty array in advance so it will be always same on shallow comparison
const EMPTY_ACCOUNT_ARRAY: Account[] = [];

export const selectDeviceAccountsWithStaking = (
    state: NativeStakingRootState,
    symbol: NetworkSymbol,
): Account[] => {
    if (!doesCoinSupportStaking(symbol)) {
        return EMPTY_ACCOUNT_ARRAY;
    }

    switch (symbol) {
        case 'eth':
        case 'thol':
        case 'tsep':
            return selectVisibleDeviceEthereumAccountsWithStakingByNetworkSymbol(state, 'eth');
        case 'dsol':
        case 'sol':
            return selectVisibleDeviceSolanaAccountsWithStakingByNetworkSymbol(state, 'sol');
        default:
            throw new UnreachableCaseError(symbol);
    }
};

export const selectHasAnyDeviceAccountsWithStaking = (
    state: NativeStakingRootState,
    symbol: NetworkSymbol,
) => selectDeviceAccountsWithStaking(state, symbol).length > 0;

export const getAccountCryptoBalanceWithStaking = (account: Account | null) => {
    if (!account) return '0';

    if (!doesCoinSupportStaking(account.symbol)) {
        return account.formattedBalance;
    }

    switch (account.symbol) {
        case 'eth':
        case 'thol':
        case 'tsep':
            return getEthereumCryptoBalanceWithStaking(account);
        case 'dsol':
        case 'sol':
            return getSolanaCryptoBalanceWithStaking(account);
        default:
            throw new UnreachableCaseError(account.symbol);
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

    if (!symbol || !doesCoinSupportStaking(symbol)) {
        return false;
    }

    switch (symbol) {
        case 'eth':
        case 'thol':
        case 'tsep':
            return selectEthereumAccountHasStaking(state, accountKey);
        case 'dsol':
        case 'sol':
            return selectSolAccountHasStaked(state, accountKey);
        default:
            throw new UnreachableCaseError(symbol);
    }
};

export const selectIsStakePendingByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;
    if (!symbol || !doesCoinSupportStaking(symbol)) {
        return false;
    }

    switch (symbol) {
        case 'eth':
        case 'thol':
        case 'tsep':
            return selectEthereumIsStakePendingByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            return selectSolanaIsStakePendingByAccountKey(state, accountKey);
        default:
            throw new UnreachableCaseError(symbol);
    }
};

export const selectIsStakeConfirmingByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;
    if (!symbol || !doesCoinSupportStaking(symbol)) {
        return false;
    }

    switch (symbol) {
        case 'eth':
        case 'thol':
        case 'tsep':
            return selectEthereumIsStakeConfirmingByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            return false; // there are no pending txns for solana staking;
        default:
            throw new UnreachableCaseError(symbol);
    }
};

export const selectAPYByAccountKey = (state: NativeStakingRootState, accountKey: AccountKey) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;
    if (!symbol || !doesCoinSupportStaking(symbol)) {
        return null;
    }

    return selectPoolStatsApyData(state, symbol);
};

export const selectStakedBalanceByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;
    if (!symbol || !doesCoinSupportStaking(symbol)) {
        return '0';
    }

    switch (symbol) {
        case 'eth':
        case 'thol':
        case 'tsep':
            return selectEthereumStakedBalanceByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            return selectSolanaStakedBalanceByAccountKey(state, accountKey);
        default:
            throw new UnreachableCaseError(symbol);
    }
};

export const selectRewardsBalanceByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;
    if (!symbol || !doesCoinSupportStaking(symbol)) {
        return '0';
    }

    switch (symbol) {
        case 'eth':
        case 'thol':
        case 'tsep':
            return selectEthereumRewardsBalanceByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            // on solana we show rewards per one epoch
            return selectExpectedRewardsForEpoch(state, accountKey);
        default:
            throw new UnreachableCaseError(symbol);
    }
};

export const selectTotalStakePendingByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;
    if (!symbol || !doesCoinSupportStaking(symbol)) {
        return '0';
    }

    switch (symbol) {
        case 'eth':
        case 'thol':
        case 'tsep':
            return selectEthereumTotalStakePendingByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            return selectSolanaTotalStakePendingByAccountKey(state, accountKey);
        default:
            throw new UnreachableCaseError(symbol);
    }
};
