import { createAction } from '@reduxjs/toolkit';

import {
    FormState,
    AccountKey,
    GeneralPrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { BlockbookTransaction } from '@trezor/blockchain-link-types';

import { SEND_MODULE_PREFIX } from './sendFormConstants';
import { SerializedTx } from './sendFormTypes';

const storeDraft = createAction(
    `${SEND_MODULE_PREFIX}/store-draft`,
    (payload: { accountKey: AccountKey; formState: FormState }) => ({
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
        accountKey: AccountKey;
        enhancedFormDraft: FormState;
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

export const sendFormActions = {
    storeDraft,
    removeDraft,
    storePrecomposedTransaction,
    storeSignedTransaction,
    discardTransaction,
    sendRaw,
    dispose,
};
