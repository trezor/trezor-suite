import type { NetworkSymbol } from '@suite-common/wallet-config';
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
    symbol: NetworkSymbol,
) => {
    if (!doesCoinSupportStaking(symbol)) {
        return EMPTY_ACCOUNT_ARRAY;
    }

    switch (symbol) {
        case 'eth':
        case 'thol':
        case 'tsep':
            return selectVisibleDeviceEthereumAccountsWithStakingByNetworkSymbol(state, 'eth');
        default:
            // This throws error if any symbol is not handled.
            symbol satisfies never;

            return EMPTY_ACCOUNT_ARRAY;
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
        default:
            // This is to make sure that all cases are handled.
            account.symbol satisfies never;

            return account.formattedBalance;
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
        default:
            // This throws error if any symbol is not handled.
            symbol satisfies never;

            return false;
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
        default:
            // This throws error if any symbol is not handled.
            symbol satisfies never;

            return false;
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
        default:
            // This throws error if any symbol is not handled.
            symbol satisfies never;

            return false;
    }
};

export const selectAPYByAccountKey = (state: NativeStakingRootState, accountKey: AccountKey) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;
    if (!symbol || !doesCoinSupportStaking(symbol)) {
        return null;
    }

    switch (symbol) {
        case 'eth':
        case 'thol':
        case 'tsep':
            return selectEthereumAPYByAccountKey(state, accountKey);
        default:
            // This throws error if any symbol is not handled.
            symbol satisfies never;

            return null;
    }
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
        default:
            // This throws error if any symbol is not handled.
            symbol satisfies never;

            return '0';
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
        default:
            // This throws error if any symbol is not handled.
            symbol satisfies never;

            return '0';
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
        default:
            // This throws error if any symbol is not handled.
            symbol satisfies never;

            return '0';
    }
};
