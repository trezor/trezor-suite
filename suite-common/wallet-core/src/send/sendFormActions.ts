import { createAction } from '@reduxjs/toolkit';

import {
    AccountKey,
    FormState,
    GeneralPrecomposedTransactionFinal,
    TokenAddress,
} from '@suite-common/wallet-types';
import { BlockbookTransaction } from '@trezor/blockchain-link-types';

import { SEND_MODULE_PREFIX } from './sendFormConstants';
import { SerializedTx } from './sendFormTypes';

const storeDraft = createAction(
    `${SEND_MODULE_PREFIX}/store-draft`,
    (payload: { accountKey: AccountKey; formState: FormState; tokenContract?: TokenAddress }) => ({
        payload,
    }),
);

const removeDraft = createAction(
    `${SEND_MODULE_PREFIX}/remove-draft`,
    (payload: { accountKey: AccountKey }) => ({
        payload,
    }),
);

const storePrecomposedTransaction = createAction(
    `${SEND_MODULE_PREFIX}/store-precomposed-transaction`,
    (payload: {
        formState: FormState;
        precomposedTransaction: GeneralPrecomposedTransactionFinal;
    }) => ({
        payload,
    }),
);

const storeSignedTransaction = createAction(
    `${SEND_MODULE_PREFIX}/store-signed-transaction`,
    (payload: { serializedTx: SerializedTx; signedTx?: BlockbookTransaction }) => ({
        payload,
    }),
);

const discardTransaction = createAction(`${SEND_MODULE_PREFIX}/discard-transaction`);

const sendRaw = createAction(`${SEND_MODULE_PREFIX}/sendRaw`, (payload: boolean) => ({
    payload,
}));

export const dispose = createAction(`${SEND_MODULE_PREFIX}/dispose`);

const setAreFeesLoading = createAction(
    `${SEND_MODULE_PREFIX}/setAreFeesLoading`,
    (payload: { areFeesLoading: boolean }) => ({ payload }),
);

export const sendFormActions = {
    storeDraft,
    removeDraft,
    storePrecomposedTransaction,
    storeSignedTransaction,
    discardTransaction,
    sendRaw,
    dispose,
    setAreFeesLoading,
};
