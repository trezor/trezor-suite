import { type Dispatch, type SetStateAction, createContext, useContext } from 'react';

import { type SerializedTx } from '@suite-common/wallet-core';
import {
    type AccountKey,
    type FormState,
    type GeneralPrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { type BlockbookTransaction } from '@trezor/blockchain-link-types';

/**
 * The transaction being signed and broadcast through its chain network, from review until it is
 * broadcast or abandoned. It has the fields the review modal reads from the send form state.
 */
export type SendSession = {
    accountKey: AccountKey;
    precomposedForm: FormState;
    precomposedTx: GeneralPrecomposedTransactionFinal;

    /** Set once the device signed; what is broadcast. */
    serializedTx?: SerializedTx;
    signedTx?: BlockbookTransaction;

    /** The account nonce the device signs with, on networks that order by nonce; shown in the review. */
    preparedNonce?: string;
};

export type SendSessionContextValue = {
    session: SendSession | undefined;
    setSession: Dispatch<SetStateAction<SendSession | undefined>>;
};

export const SendSessionContext = createContext<SendSessionContextValue | null>(null);

const NO_SESSION_CONTEXT: SendSessionContextValue = {
    session: undefined,
    setSession: () => {},
};

/** The send session; none outside `SendSessionProvider`, e.g. in Connect popup modals. */
export const useSendSessionContext = () => useContext(SendSessionContext) ?? NO_SESSION_CONTEXT;

export const useSendSession = () => useSendSessionContext().session;
