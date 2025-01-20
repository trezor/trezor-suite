import { createAction } from '@reduxjs/toolkit';

import { PendingConnectionProposal, WalletConnectSession } from './walletConnectTypes';

export const ACTION_PREFIX = '@suite-common/walletconnect';

const saveSession = createAction(
    `${ACTION_PREFIX}/saveSession`,
    (payload: WalletConnectSession) => ({
        payload,
    }),
);

const removeSession = createAction(
    `${ACTION_PREFIX}/removeSession`,
    (payload: { topic: string }) => ({
        payload,
    }),
);

const createSessionProposal = createAction(
    `${ACTION_PREFIX}/createSessionProposal`,
    (payload: PendingConnectionProposal) => ({
        payload,
    }),
);

const clearSessionProposal = createAction(`${ACTION_PREFIX}/clearSessionProposal`);

const expireSessionProposal = createAction(`${ACTION_PREFIX}/expireSessionProposal`);

export const walletConnectActions = {
    saveSession,
    removeSession,
    createSessionProposal,
    clearSessionProposal,
    expireSessionProposal,
} as const;
