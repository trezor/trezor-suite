import type { MiddlewareAPI } from 'redux';
import { UI, DEVICE } from '@trezor/connect';
import { SUITE, ROUTER, MESSAGE_SYSTEM } from '@suite-actions/constants';
import { SESSION_ROUND_CHANGED } from '@wallet-actions/constants/coinjoinConstants';
import { DISCOVERY } from '@wallet-actions/constants';
import * as coinjoinAccountActions from '@wallet-actions/coinjoinAccountActions';
import { CoinjoinService } from '@suite/services/coinjoin';
import type { AppState, Action, Dispatch } from '@suite-types';
import { RoundPhase } from '@wallet-types/coinjoin';
import { blockchainActions, accountsActions } from '@suite-common/wallet-core';
import { selectIsAnySessionInCriticalPhase } from '@wallet-reducers/coinjoinReducer';
import { Feature, selectIsFeatureDisabled } from '@suite-reducers/messageSystemReducer';

export const coinjoinMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        // cancel discovery for each CoinjoinBackend
        if (action.type === ROUTER.LOCATION_CHANGE && action.payload.app !== 'wallet') {
            CoinjoinService.getInstances().forEach(({ backend }) => backend.cancel());
        }

        // do not close success and critical phase modals when they are open, similar to discovery middleware
        const {
            modal,
            wallet: {
                coinjoin: { accounts: previousAccountsState },
            },
        } = api.getState();
        const allowedModals = ['coinjoin-success', 'more-rounds-needed', 'critical-coinjoin-phase'];

        if (
            action.type === UI.CLOSE_UI_WINDOW &&
            'payload' in modal &&
            allowedModals.includes(modal.payload?.type)
        ) {
            return action;
        }

        // propagate action to reducers
        next(action);

        if (action.type === SUITE.READY) {
            api.dispatch(coinjoinAccountActions.restoreCoinjoinAccounts());
        }

        if (accountsActions.removeAccount.match(action)) {
            api.dispatch(coinjoinAccountActions.forgetCoinjoinAccounts(action.payload));
        }

        if (action.type === DISCOVERY.START) {
            // find all coinjoin accounts
            const coinjoinAccounts = api
                .getState()
                .wallet.accounts.filter(a => a.accountType === 'coinjoin');
            if (coinjoinAccounts.length > 0) {
                coinjoinAccounts.forEach(a =>
                    api.dispatch(coinjoinAccountActions.fetchAndUpdateAccount(a)),
                );
            }
        }

        if (action.type === DEVICE.DISCONNECT && action.payload.id) {
            api.dispatch(coinjoinAccountActions.pauseCoinjoinSessionByDeviceId(action.payload.id));
        }

        if (action.type === COINJOIN.CLIENT_SESSION_PHASE) {
            const account = api
                .getState()
                .wallet.coinjoin.accounts.find(({ key }) =>
                    action.payload.accountKeys.includes(key),
                ); // all accounts asocciated with the accountKeys array have the same session phase

            if (account) {
                const { key, session } = account;

                const queueLength = session?.sessionPhaseQueue?.length;
                const previousState = previousAccountsState
                    .find(account => account.key === key)
                    ?.session?.sessionPhaseQueue.at(-1);

                const isSamePhase = action.payload.phase === previousState;

                if (queueLength && queueLength > 1 && !isSamePhase) {
                    const nextPhaseDelay =
                        SESSION_PHASE_TRANSITION_DELAY -
                        (Date.now() - (session?.lastSessionPhaseChangeTimestamp || Date.now()));
                    const otherPhasesDelay = SESSION_PHASE_TRANSITION_DELAY * (queueLength - 2);
                    const timeToDelay = nextPhaseDelay + otherPhasesDelay;

                    setTimeout(() => {
                        api.dispatch(clientShiftSessionPhase(action.payload.accountKeys));
                    }, timeToDelay);
                }
            }
        }

        if (blockchainActions.synced.match(action)) {
            // find all coinjoin accounts for network
            const coinjoinAccounts = api
                .getState()
                .wallet.accounts.filter(
                    a => a.accountType === 'coinjoin' && a.symbol === action.payload.symbol,
                );
            if (coinjoinAccounts.length > 0) {
                coinjoinAccounts.forEach(a =>
                    api.dispatch(coinjoinAccountActions.fetchAndUpdateAccount(a)),
                );
            }
        }

        if (action.type === SUITE.TOR_STATUS) {
            if (['Disabling', 'Disabled', 'Error'].includes(action.payload)) {
                api.dispatch(coinjoinAccountActions.pauseInterruptAllCoinjoinSessions());
            }
            // We restore sessions that were interrupted when successfully Enabled, not when Enabling.
            if (action.payload === 'Enabled') {
                api.dispatch(coinjoinAccountActions.restoreAllInterruptedCoinjoinSession());
            }
        }

        if (
            action.type === MESSAGE_SYSTEM.SAVE_VALID_MESSAGES ||
            action.type === SESSION_ROUND_CHANGED
        ) {
            const state = api.getState();

            const isCoinJoinDisabledByFeatureFlag = selectIsFeatureDisabled(
                state,
                Feature.coinjoin,
            );

            if (isCoinJoinDisabledByFeatureFlag) {
                const isAnySessionInCriticalPhase = selectIsAnySessionInCriticalPhase(state);
                const hasCriticalPhaseJustEnded =
                    action.type === SESSION_ROUND_CHANGED &&
                    action.payload.round.phase === RoundPhase.Ended;

                if (!isAnySessionInCriticalPhase || hasCriticalPhaseJustEnded) {
                    api.dispatch(coinjoinAccountActions.pauseInterruptAllCoinjoinSessions());
                }
            }
        }

        return action;
    };
