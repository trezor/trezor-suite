import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { isPending } from '@suite-common/wallet-utils';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';

import { getSolStakingAccountsInfo } from './solanaStakingUtils';
import { type AccountsRootState } from '../../accounts/accountsReducer';
import { selectAccountByKey, selectDeviceAccounts } from '../../accounts/accountsSelectors';
import { selectAccountStakeTransactions } from '../../transactions/transactionsSelectors';
import { type StakeRootState } from '../stakingReducerTypes';

const createMemoizedSelector = createWeakMapSelector.withTypes<StakeRootState>();

export const selectVisibleDeviceSolanaAccountsWithStakingByNetworkSymbol = createMemoizedSelector(
    [selectDeviceAccounts, (_state, symbol: NetworkSymbol) => symbol],
    (accounts, symbol) =>
        returnStableArrayIfEmpty(
            accounts.filter(
                account =>
                    account.symbol === symbol &&
                    account.visible &&
                    account.networkType === 'solana' &&
                    !!account.misc?.solStakingAccounts?.length,
            ),
        ),
);

export const selectSolStakingAccountsInfoByAccountKey = createMemoizedSelector(
    [selectAccountByKey],
    account => {
        if (!account) return null;

        return getSolStakingAccountsInfo(account);
    },
);

export const selectSolanaIsStakePendingByAccountKey = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => {
    const stakingInfo = selectSolStakingAccountsInfoByAccountKey(state, accountKey);

    if (!stakingInfo) return false;

    return Number(stakingInfo.solPendingStakeBalance ?? 0) > 0;
};

export const selectSolanaIsStakeConfirmingByAccountKey = (
    state: StakeRootState,
    accountKey: AccountKey,
) => selectAccountStakeTransactions(state, accountKey).some(tx => isPending(tx));

export const selectSolanaStakedBalanceByAccountKey = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => {
    const stakingInfo = selectSolStakingAccountsInfoByAccountKey(state, accountKey);

    if (!stakingInfo?.solStakedBalance) return '0';

    return stakingInfo.solStakedBalance;
};

export const selectSolanaTotalStakePendingByAccountKey = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => {
    const stakingInfo = selectSolStakingAccountsInfoByAccountKey(state, accountKey);

    if (!stakingInfo) return '0';

    return stakingInfo.solPendingStakeBalance;
};

export const selectSolanaClaimableAmountByAccountKey = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => {
    const stakingInfo = selectSolStakingAccountsInfoByAccountKey(state, accountKey);

    if (!stakingInfo) return '0';

    return stakingInfo.solClaimableBalance;
};

export const selectSolanaCanClaimByAccountKey = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => {
    const stakingInfo = selectSolStakingAccountsInfoByAccountKey(state, accountKey);

    if (!stakingInfo) return false;

    return stakingInfo.canClaimSol;
};

export const selectSolanaUnstakingBalanceByAccountKey = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => {
    const stakingInfo = selectSolStakingAccountsInfoByAccountKey(state, accountKey);

    if (!stakingInfo) return '0';

    return stakingInfo.solPendingUnstakeBalance;
};
