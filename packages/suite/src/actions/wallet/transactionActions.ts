import { TRANSACTION } from '@wallet-actions/constants/index';

import { Dispatch } from '@suite-types/index';

export interface Transaction {
    id?: number;
    accountId: number;
    txId: string;
    details: {
        name: string;
        price: number;
        productCode: string;
    };
}

export type TransactionAction =
    | { type: typeof TRANSACTION.ADD; transaction: Transaction }
    | { type: typeof TRANSACTION.REMOVE; txId: string }
    | { type: typeof TRANSACTION.FROM_STORAGE; transactions: Transaction[] };

export const add = (transaction: Transaction) => async (dispatch: Dispatch): Promise<void> => {
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

export const fromStorage = (transactions: Transaction[]) => ({
    type: TRANSACTION.FROM_STORAGE,
    transactions,
});
