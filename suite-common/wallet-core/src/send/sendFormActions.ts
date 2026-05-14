import { createAction } from '@reduxjs/toolkit';

import {
    type AccountKey,
    type FormState,
    type GeneralPrecomposedTransactionFinal,
    type TokenAddress,
} from '@suite-common/wallet-types';
import { type BlockbookTransaction } from '@trezor/blockchain-link-types';

import { SEND_MODULE_PREFIX } from './sendFormConstants';
import { type SerializedTx } from './sendFormTypes';

const storeDraft = createAction(
    `${SEND_MODULE_PREFIX}/store-draft`,
    (payload: { accountKey: AccountKey; formState: FormState; tokenContract?: TokenAddress }) => ({
        payload,
    }),
);

const removeDraft = createAction(
    `${SEND_MODULE_PREFIX}/remove-draft`,
    (payload: { accountKey: AccountKey; tokenContract?: TokenAddress }) => ({
        payload,
    }),
);

const storePrecomposedTransaction = createAction(
    `${SEND_MODULE_PREFIX}/store-precomposed-transaction`,
    (payload: {
        formState: FormState;
        precomposedTransaction: GeneralPrecomposedTransactionFinal;
        accountKey?: AccountKey;
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

const clearSignedTransactionData = createAction(`${SEND_MODULE_PREFIX}/clear-signed-transaction`);

const sendRaw = createAction(`${SEND_MODULE_PREFIX}/sendRaw`, (payload: boolean) => ({
    payload,
}));

export const dispose = createAction(`${SEND_MODULE_PREFIX}/dispose`);

export const sendFormActions = {
    storeDraft,
    removeDraft,
    storePrecomposedTransaction,
    storeSignedTransaction,
    discardTransaction,
    clearSignedTransactionData,
    sendRaw,
    dispose,
};
