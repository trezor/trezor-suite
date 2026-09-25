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

// The EVM nonce resolved at signing time (backend-checked, next-available). Stored so the
// transaction review modal can display the exact nonce being signed without resolving it again.
const storeResolvedEthereumNonce = createAction(
    `${SEND_MODULE_PREFIX}/store-resolved-ethereum-nonce`,
    (payload: string) => ({
        payload,
    }),
);

// Whether that nonce sits above what the backend's pending count can account for (see
// getEvmPendingNonceCeiling). Surfaced as a review warning; it never blocks signing.
const storeIsEthereumNonceAbovePending = createAction(
    `${SEND_MODULE_PREFIX}/store-is-ethereum-nonce-above-pending`,
    (payload: boolean) => ({
        payload,
    }),
);

// Whether the backend reported in-flight txs this account cannot see (see hasUnknownPendingEvmTxs).
// Surfaced as a review warning; like the ceiling check it never blocks signing.
const storeHasUnknownPendingNonces = createAction(
    `${SEND_MODULE_PREFIX}/store-has-unknown-pending-nonces`,
    (payload: boolean) => ({
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
    storeResolvedEthereumNonce,
    storeIsEthereumNonceAbovePending,
    storeHasUnknownPendingNonces,
    discardTransaction,
    clearSignedTransactionData,
    sendRaw,
    dispose,
};
