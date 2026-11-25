import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { isStakingSymbol } from '@suite-common/wallet-utils';
import { exhaustive } from '@trezor/type-utils';

import { type AccountsRootState } from '../accounts/accountsReducer';
import {
    selectAccountByKey,
    selectAdaAccountHasStaked,
    selectSolAccountHasStaked,
} from '../accounts/accountsSelectors';
import { DEFAULT_VOTING_OPTION } from './cardano/cardanoStakingConstants';
import {
    selectCardanoStakedBalanceByAccountKey,
    selectVisibleDeviceCardanoAccountsWithStakingByNetworkSymbol,
} from './cardano/cardanoStakingSelectors';
import type {
    AccountVotingDelegation,
    VotingDelegationOption,
} from './cardano/cardanoStakingTypes';
import {
    selectEthereumAccountHasStaking,
    selectEthereumCanClaimByAccountKey,
    selectEthereumClaimableAmountByAccountKey,
    selectEthereumIsStakeConfirmingByAccountKey,
    selectEthereumIsStakePendingByAccountKey,
    selectEthereumStakedBalanceByAccountKey,
    selectEthereumTotalStakePendingByAccountKey,
    selectEthereumUnstakableBalanceByAccountKey,
    selectEthereumUnstakingBalanceByAccountKey,
    selectVisibleDeviceEthereumAccountsWithStakingByNetworkSymbol,
} from './ethereum/ethereumStakingSelectors';
import { getEthereumCryptoBalanceWithStaking } from './ethereum/ethereumStakingUtils';
import { selectStake, selectStakeAccountKey } from './shared/stakingSelectors';
import {
    selectSolanaCanClaimByAccountKey,
    selectSolanaClaimableAmountByAccountKey,
    selectSolanaIsStakeConfirmingByAccountKey,
    selectSolanaIsStakePendingByAccountKey,
    selectSolanaStakedBalanceByAccountKey,
    selectSolanaTotalStakePendingByAccountKey,
    selectSolanaUnstakingBalanceByAccountKey,
    selectVisibleDeviceSolanaAccountsWithStakingByNetworkSymbol,
} from './solana/solanaStakingSelectors';
import { getSolanaCryptoBalanceWithStaking } from './solana/solanaStakingUtils';
import type { StakeRootState, StakeSliceRootState } from './stakingReducerTypes';
import {
    selectTronAccountHasStaked,
    selectTronStakedBalanceByAccountKey,
    selectTronUnstakedBalanceByAccountKey,
    selectVisibleDeviceTronAccountsWithStakingByNetworkSymbol,
} from './tron/tronStakingSelectors';
import { getTronCryptoBalanceWithStaking } from './tron/tronStakingUtils';

const EMPTY_ACCOUNT_ARRAY: Account[] = [];

const selectDeviceAccountsWithStaking = (
    state: StakeRootState,
    symbol: NetworkSymbol,
): Account[] => {
    if (!isStakingSymbol(symbol)) {
        return EMPTY_ACCOUNT_ARRAY;
    }

    switch (symbol) {
        case 'eth':
        case 'thod':
            return selectVisibleDeviceEthereumAccountsWithStakingByNetworkSymbol(
                state,
                asNetworkSymbol('eth'),
            );
        case 'dsol':
        case 'sol':
            return selectVisibleDeviceSolanaAccountsWithStakingByNetworkSymbol(
                state,
                asNetworkSymbol('sol'),
            );
        case 'ada':
            return selectVisibleDeviceCardanoAccountsWithStakingByNetworkSymbol(
                state,
                asNetworkSymbol('ada'),
            );
        case 'trx':
            return selectVisibleDeviceTronAccountsWithStakingByNetworkSymbol(
                state,
                asNetworkSymbol('trx'),
            );
        default:
            return exhaustive(symbol);
    }
};

export const selectHasAnyDeviceAccountsWithStaking = (
    state: StakeRootState,
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
        case 'trx':
            return getTronCryptoBalanceWithStaking(account);
        default:
            return exhaustive(account.symbol);
    }
};

export const selectAccountHasStaking = (state: StakeRootState, accountKey: AccountKey) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;

    if (!symbol || !isStakingSymbol(symbol)) return false;

    switch (symbol) {
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
            return exhaustive(symbol);
    }
};

export const selectIsStakePendingByAccountKey = (
    state: StakeRootState,
    accountKey: AccountKey | null,
) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;

    if (!symbol || !isStakingSymbol(symbol) || !accountKey) return false;

    switch (symbol) {
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
            return exhaustive(symbol);
    }
};

export const selectIsStakeConfirmingByAccountKey = (
    state: StakeRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;

    if (!symbol || !isStakingSymbol(symbol)) return false;

    switch (symbol) {
        case 'eth':
        case 'thod':
            return selectEthereumIsStakeConfirmingByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            return selectSolanaIsStakeConfirmingByAccountKey(state, accountKey);
        case 'ada':
            return false;
        case 'trx':
            return false;
        default:
            return exhaustive(symbol);
    }
};

export const selectStakedBalanceByAccountKey = (state: StakeRootState, accountKey: AccountKey) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;

    if (!symbol || !isStakingSymbol(symbol)) return '0';

    switch (symbol) {
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
            return exhaustive(symbol);
    }
};

export const selectUnstakableBalanceByAccountKey = (
    state: StakeRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;

    if (!symbol || !isStakingSymbol(symbol)) return '0';

    switch (symbol) {
        case 'eth':
        case 'thod':
            return selectEthereumUnstakableBalanceByAccountKey(state, accountKey);
        case 'dsol':
        case 'sol':
            return selectSolanaStakedBalanceByAccountKey(state, accountKey);
        case 'ada':
            return selectCardanoStakedBalanceByAccountKey(state, accountKey);
        case 'trx':
            return selectTronStakedBalanceByAccountKey(state, accountKey);
        default:
            return exhaustive(symbol);
    }
};

export const selectTotalStakePendingByAccountKey = (
    state: StakeRootState,
    accountKey: AccountKey | null,
) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;

    if (!symbol || !isStakingSymbol(symbol) || !accountKey) return '0';

    switch (symbol) {
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
            return exhaustive(symbol);
    }
};

export const selectClaimableAmountByAccountKey = (
    state: StakeRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;

    if (!symbol || !isStakingSymbol(symbol)) return '0';

    switch (symbol) {
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
            return exhaustive(symbol);
    }
};

export const selectCanClaimByAccountKey = (state: StakeRootState, accountKey: AccountKey) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;

    if (!symbol || !isStakingSymbol(symbol)) return false;

    switch (symbol) {
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
            return exhaustive(symbol);
    }
};

export const selectUnstakingBalanceByAccountKey = (
    state: StakeRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const symbol = account?.symbol;

    if (!symbol || !isStakingSymbol(symbol)) return '0';

    switch (symbol) {
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
            return exhaustive(symbol);
    }
};

/**
 * The selection the user last confirmed, together with the account it was confirmed for. Composing
 * paths pass it to `prepareTxPlan`, which honours it only for that very account; anything reading it
 * to render a selection wants `selectVotingDelegationOption` instead.
 */
export const selectStakeVotingDelegation = (
    state: StakeSliceRootState,
): AccountVotingDelegation | undefined => selectStake(state).votingDelegation;

export const selectVotingDelegationOption = (
    state: StakeSliceRootState,
    accountKey: AccountKey,
): VotingDelegationOption => {
    const votingDelegation = selectStakeVotingDelegation(state);

    return votingDelegation?.accountKey === accountKey
        ? votingDelegation.option
        : DEFAULT_VOTING_OPTION;
};

export const selectStakePrecomposedForm = (state: StakeSliceRootState) =>
    selectStake(state).precomposedForm;

export const selectStakeAccount = (
    state: StakeSliceRootState & AccountsRootState,
): Account | undefined => {
    const accountKey = selectStakeAccountKey(state);

    if (!accountKey) return undefined;

    return selectAccountByKey(state, accountKey) ?? undefined;
};
