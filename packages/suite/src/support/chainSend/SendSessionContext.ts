import { type Dispatch, type SetStateAction, createContext, useContext } from 'react';

import { type SerializedTx } from '@suite-common/wallet-core';
import {
    type AccountKey,
    type FormState,
    type GeneralPrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { type BlockbookTransaction } from '@trezor/blockchain-link-types';
import type { RuntimeEvmNetworkDefinition } from '@trezor/network-ethereum-suite-common';
import type { ChainSendAccount } from '@trezor/network-module-suite-common-types';

/** A send on a runtime network: its account lives on no wallet page, only at a wallet account's address. */
export type RuntimeSendTarget = {
    network: RuntimeEvmNetworkDefinition;
    account: ChainSendAccount;

    /** The wallet account whose address and path the runtime account uses. */
    walletAccountKey: AccountKey;
};

type SendSessionTransaction = {
    precomposedForm: FormState;
    precomposedTx: GeneralPrecomposedTransactionFinal;

    /** Set once the device signed; what is broadcast. */
    serializedTx?: SerializedTx;
    signedTx?: BlockbookTransaction;

    /** The account nonce the device signs with, on networks that order by nonce; shown in the review. */
    preparedNonce?: string;
};

/**
 * The transaction being signed and broadcast through its chain network, from review until it is
 * broadcast or abandoned. It has the fields the review modal reads from the send form state. A
 * wallet account's send is reviewed like any wallet send; a runtime network's has its own review.
 */
export type SendSession =
    | (SendSessionTransaction & { kind: 'wallet'; accountKey: AccountKey })
    | (SendSessionTransaction & { kind: 'runtime'; runtime: RuntimeSendTarget });

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
