import { TRANSACTION } from '@wallet-actions/constants/index';

import { Dispatch } from '@suite-types/index';
import { WalletTransaction } from '@suite/storage';

export type TransactionAction =
    | { type: typeof TRANSACTION.ADD; transaction: WalletTransaction }
    | { type: typeof TRANSACTION.REMOVE; txId: string }
    | { type: typeof TRANSACTION.UPDATE; txId: string; timestamp: number }
    | { type: typeof TRANSACTION.FROM_STORAGE; transactions: WalletTransaction[] };

export const add = (transaction: WalletTransaction) => async (
    dispatch: Dispatch,
): Promise<void> => {
    // const tx: Transaction = {
    //     accountId: 0,
    //     txId: 'abc',
    //     details: {
    //         name: 'label',
    //         price: 2,
    //         productCode: 'code',
    //     },
    // };

    dispatch({
        type: TRANSACTION.ADD,
        transaction,
    });
};

export const remove = (txId: string) => ({
    type: TRANSACTION.REMOVE,
    txId,
});

export const update = (txId: string) => ({
    type: TRANSACTION.UPDATE,
    txId,
    timestamp: Date.now(),
});

export const fromStorage = (transactions: WalletTransaction[]) => ({
    type: TRANSACTION.FROM_STORAGE,
    transactions,
});
