import { PayloadAction } from '@reduxjs/toolkit';

import { createReducerWithExtraDeps } from '@suite-common/redux-utils';

import { walletConnectActions } from './walletConnectActions';
import { PendingConnectionProposal, WalletConnectSession } from './walletConnectTypes';

export type WalletConnectState = {
    sessions: WalletConnectSession[];
    pendingProposal: PendingConnectionProposal | undefined;
};

type WalletConnectStateRootState = {
    walletConnect: WalletConnectState;
};

type StorageActionPayload = {
    connect: {
        walletConnectSessions: WalletConnectSession[];
    };
};

const walletConnectInitialState: WalletConnectState = {
    sessions: [],
    pendingProposal: undefined,
};

export const prepareWalletConnectReducer = createReducerWithExtraDeps(
    walletConnectInitialState,
    (builder, extra) => {
        builder
            .addCase(
                extra.actionTypes.storageLoad,
                (state, { payload }: PayloadAction<StorageActionPayload>) => {
                    if (payload.connect?.walletConnectSessions)
                        state.sessions = payload.connect.walletConnectSessions;
                },
            )
            .addCase(walletConnectActions.saveSession, (state, { payload }) => {
                const { topic, ...rest } = payload;
                const exists = state.sessions.find(session => session.topic === topic);
                if (exists) {
                    state.sessions = state.sessions.map(session =>
                        session.topic === topic ? { ...session, ...rest } : session,
                    );
                } else {
                    state.sessions.push(payload);
                }
            })
            .addCase(walletConnectActions.removeSession, (state, { payload }) => {
                const { topic } = payload;
                state.sessions = state.sessions.filter(session => session.topic !== topic);
            })
            .addCase(walletConnectActions.createSessionProposal, (state, { payload }) => {
                state.pendingProposal = payload;
            })
            .addCase(walletConnectActions.clearSessionProposal, state => {
                state.pendingProposal = undefined;
            })
            .addCase(walletConnectActions.expireSessionProposal, state => {
                if (state.pendingProposal) state.pendingProposal.expired = true;
            });
    },
);

export const selectSessions = (state: WalletConnectStateRootState) => state.walletConnect.sessions;

export const selectSessionByTopic = (state: WalletConnectStateRootState, topic: string) =>
    state.walletConnect.sessions.find(session => session.topic === topic);

export const selectPendingProposal = (state: WalletConnectStateRootState) =>
    state.walletConnect.pendingProposal;
