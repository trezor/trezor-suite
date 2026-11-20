import {
    type TransactionsRootState,
    getTxStakeType,
    selectAccountStakeTypeTransactions,
} from '@suite-common/wallet-core';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';

const createMemoizedSelector = createWeakMapSelector.withTypes<TransactionsRootState>();

const isStakeOrUnstakeTransaction = (transaction: WalletAccountTransaction): boolean => {
    const stakeType = getTxStakeType(transaction);

    return stakeType === 'stake' || stakeType === 'unstake';
};

// The instant-stake banner diffs the internal transfers of the stake and unstake transactions, the
// confirmed ones included, which the position's pending transactions do not hold.
export const selectAccountInstantStakeTransactions = createMemoizedSelector(
    [selectAccountStakeTypeTransactions],
    transactions => returnStableArrayIfEmpty(transactions.filter(isStakeOrUnstakeTransaction)),
);
