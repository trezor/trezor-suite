import { NetworkSymbol } from '@suite-common/wallet-config';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { Account, AccountKey } from '@suite-common/wallet-types';
import { getEthereumCryptoBalanceWithStaking } from '@suite-common/wallet-utils';

import {
    selectEthereumAccountHasStaking,
    selectEthereumAPYByAccountKey,
    selectEthereumIsStakeConfirmingByAccountKey,
    selectEthereumIsStakePendingByAccountKey,
    selectEthereumRewardsBalanceByAccountKey,
    selectEthereumStakedBalanceByAccountKey,
    selectEthereumTotalStakePendingByAccountKey,
    selectVisibleDeviceEthereumAccountsWithStakingByNetworkSymbol,
} from './ethereumStakingSelectors';
import { NativeStakingRootState } from './types';
import { doesCoinSupportStaking } from './utils';

// create empty array in advance so it will be always same on shallow comparison
const EMPTY_ACCOUNT_ARRAY: Account[] = [];

export const selectDeviceAccountsWithStaking = (
    state: NativeStakingRootState,
    networkSymbol: NetworkSymbol,
) => {
    if (!doesCoinSupportStaking(networkSymbol)) {
        return EMPTY_ACCOUNT_ARRAY;
    }

    switch (networkSymbol) {
        case 'eth':
        case 'thol':
        case 'tsep':
            return selectVisibleDeviceEthereumAccountsWithStakingByNetworkSymbol(state, 'eth');
        default:
            // This throws error if any networkSymbol is not handled.
            networkSymbol satisfies never;

            return EMPTY_ACCOUNT_ARRAY;
    }
};

export const selectHasAnyDeviceAccountsWithStaking = (
    state: NativeStakingRootState,
    networkSymbol: NetworkSymbol,
) => {
    return selectDeviceAccountsWithStaking(state, networkSymbol).length > 0;
};

export const selectAccountCryptoBalanceWithStaking = (
    state: NativeStakingRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    if (!account) return '0';

    if (!doesCoinSupportStaking(account.symbol)) {
        return account.formattedBalance;
    }

    switch (account.symbol) {
        case 'eth':
        case 'thol':
        case 'tsep':
            return getEthereumCryptoBalanceWithStaking(account);
        default:
            // This is to make sure that all cases are handled.
            account.symbol satisfies never;

            return account.formattedBalance;
    }
};

export const selectAccountHasStaking = (state: NativeStakingRootState, accountKey: AccountKey) => {
    const account = selectAccountByKey(state, accountKey);
    const accountSymbol = account?.symbol;

    if (!accountSymbol || !doesCoinSupportStaking(accountSymbol)) {
        return false;
    }

    switch (accountSymbol) {
        case 'eth':
        case 'thol':
        case 'tsep':
            return selectEthereumAccountHasStaking(state, accountKey);
        default:
            // This throws error if any networkSymbol is not handled.
            accountSymbol satisfies never;

            return false;
    }
};

export const selectIsStakePendingByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const accountSymbol = account?.symbol;
    if (!accountSymbol || !doesCoinSupportStaking(accountSymbol)) {
        return false;
    }

    switch (accountSymbol) {
        case 'eth':
        case 'thol':
        case 'tsep':
            return selectEthereumIsStakePendingByAccountKey(state, accountKey);
        default:
            // This throws error if any networkSymbol is not handled.
            accountSymbol satisfies never;

            return false;
    }
};

export const selectIsStakeConfirmingByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const accountSymbol = account?.symbol;
    if (!accountSymbol || !doesCoinSupportStaking(accountSymbol)) {
        return false;
    }

    switch (accountSymbol) {
        case 'eth':
        case 'thol':
        case 'tsep':
            return selectEthereumIsStakeConfirmingByAccountKey(state, accountKey);
        default:
            // This throws error if any networkSymbol is not handled.
            accountSymbol satisfies never;

            return false;
    }
};

export const selectAPYByAccountKey = (state: NativeStakingRootState, accountKey: AccountKey) => {
    const account = selectAccountByKey(state, accountKey);
    const accountSymbol = account?.symbol;
    if (!accountSymbol || !doesCoinSupportStaking(accountSymbol)) {
        return null;
    }

    switch (accountSymbol) {
        case 'eth':
        case 'thol':
        case 'tsep':
            return selectEthereumAPYByAccountKey(state, accountKey);
        default:
            // This throws error if any networkSymbol is not handled.
            accountSymbol satisfies never;

            return null;
    }
};

export const selectStakedBalanceByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const accountSymbol = account?.symbol;
    if (!accountSymbol || !doesCoinSupportStaking(accountSymbol)) {
        return '0';
    }

    switch (accountSymbol) {
        case 'eth':
        case 'thol':
        case 'tsep':
            return selectEthereumStakedBalanceByAccountKey(state, accountKey);
        default:
            // This throws error if any networkSymbol is not handled.
            accountSymbol satisfies never;

            return '0';
    }
};

export const selectRewardsBalanceByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const accountSymbol = account?.symbol;
    if (!accountSymbol || !doesCoinSupportStaking(accountSymbol)) {
        return '0';
    }

    switch (accountSymbol) {
        case 'eth':
        case 'thol':
        case 'tsep':
            return selectEthereumRewardsBalanceByAccountKey(state, accountKey);
        default:
            // This throws error if any networkSymbol is not handled.
            accountSymbol satisfies never;

            return '0';
    }
};

export const selectTotalStakePendingByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const accountSymbol = account?.symbol;
    if (!accountSymbol || !doesCoinSupportStaking(accountSymbol)) {
        return '0';
    }

    switch (accountSymbol) {
        case 'eth':
        case 'thol':
        case 'tsep':
            return selectEthereumTotalStakePendingByAccountKey(state, accountKey);
        default:
            // This throws error if any networkSymbol is not handled.
            accountSymbol satisfies never;

            return '0';
    }
};
