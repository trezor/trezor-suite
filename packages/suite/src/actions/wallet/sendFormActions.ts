import {
    FormState,
    PrecomposedTransactionFinal,
    FormSignedTx,
    AccountKey,
    TxFinalCardano,
} from '@suite-common/wallet-types';
import { createAction } from '@reduxjs/toolkit';
import { MODULE_PREFIX } from './send/constants';

const storeDraft = createAction(
    `${MODULE_PREFIX}/store-draft`,
    (payload: { accountKey: AccountKey; formState: FormState }) => ({
        payload,
    }),
);

const removeDraft = createAction(
    `${MODULE_PREFIX}/remove-draft`,
    (payload: { accountKey: AccountKey }) => ({
        payload,
    }),
);

const storePrecomposedTransaction = createAction(
    `${MODULE_PREFIX}/store-precomposed-transaction`,
    (payload: {
        formState: FormState;
        transactionInfo: PrecomposedTransactionFinal | TxFinalCardano;
    }) => ({
        payload,
    }),
);

const storeSignedTransaction = createAction(
    `${MODULE_PREFIX}/store-signed-transaction`,
    (payload: FormSignedTx) => ({
        payload,
    }),
);

const discardTransaction = createAction(`${MODULE_PREFIX}/discard-transaction`);

const sendRaw = createAction(`${MODULE_PREFIX}/sendRaw`, (payload: boolean) => ({
    payload,
}));

export const dispose = createAction(`${MODULE_PREFIX}/dispose`);

export const sendFormActions = {
    storeDraft,
    removeDraft,
    storePrecomposedTransaction,
    storeSignedTransaction,
    discardTransaction,
    sendRaw,
    dispose,
};
