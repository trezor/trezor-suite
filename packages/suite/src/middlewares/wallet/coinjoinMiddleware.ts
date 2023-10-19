import type { MiddlewareAPI } from 'redux';
import { isAnyOf } from '@reduxjs/toolkit';

import {
    discoveryActions,
    accountsActions,
    blockchainActions,
    selectAccountByKey,
    transactionsActions,
} from '@suite-common/wallet-core';
import {
    Feature,
    selectFeatureConfig,
    selectIsFeatureDisabled,
    messageSystemActions,
} from '@suite-common/message-system';
import { addToast } from '@suite-common/toast-notifications';
import { RoundPhase, SessionPhase } from '@trezor/coinjoin';
import { UI, DEVICE } from '@trezor/connect';
import { arrayDistinct } from '@trezor/utils';

import { SUITE, ROUTER } from 'src/actions/suite/constants';
import {
    SESSION_ROUND_CHANGED,
    SET_DEBUG_SETTINGS,
    SESSION_TX_BROADCASTED,
} from 'src/actions/wallet/constants/coinjoinConstants';
import { COINJOIN } from 'src/actions/wallet/constants';
import * as coinjoinAccountActions from 'src/actions/wallet/coinjoinAccountActions';
import * as coinjoinClientActions from 'src/actions/wallet/coinjoinClientActions';
import * as storageActions from 'src/actions/suite/storageActions';
import { CoinjoinService } from 'src/services/coinjoin';
import type { AppState, Action, Dispatch } from 'src/types/suite';
import { CoinjoinConfig } from 'src/types/wallet/coinjoin';
import {
    selectCoinjoinAccountByKey,
    selectIsAnySessionInCriticalPhase,
    selectIsAccountWithSessionInCriticalPhaseByAccountKey,
    selectIsCoinjoinBlockedByTor,
    selectCoinjoinSessionBlockerByAccountKey,
} from 'src/reducers/wallet/coinjoinReducer';

export const coinjoinMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        // cancel discovery for each CoinjoinBackend
        if (action.type === ROUTER.LOCATION_CHANGE && action.payload.app !== 'wallet') {
            CoinjoinService.getInstances().forEach(({ backend }) => backend.cancel());
        }

        // do not close success and critical phase modals when they are open, similar to discovery middleware
        const { modal } = api.getState();
        const allowedModals = ['coinjoin-success', 'more-rounds-needed', 'critical-coinjoin-phase'];

        if (
            action.type === UI.CLOSE_UI_WINDOW &&
            'payload' in modal &&
            allowedModals.includes(modal.payload?.type)
        ) {
            return action;
        }

        if (action.type === SUITE.INIT) {
            api.dispatch(coinjoinAccountActions.logCoinjoinAccounts());
        }

        if (accountsActions.removeAccount.match(action)) {
            action.payload.forEach(account =>
                api.dispatch(coinjoinAccountActions.stopCoinjoinAccount(account)),
            );
        }

        // propagate action to reducers
        next(action);

        if (accountsActions.removeAccount.match(action)) {
            action.payload
                .filter(({ accountType }) => accountType === 'coinjoin')
                .map(({ symbol }) => symbol)
                .filter(arrayDistinct)
                .forEach(symbol =>
                    api.dispatch(coinjoinAccountActions.clearCoinjoinInstances(symbol)),
                );
        }

        // catch broadcasted transactions and create prepending transaction(s) for each account
        if (action.type === SESSION_TX_BROADCASTED && action.payload.round.broadcastedTxDetails) {
            const {
                accountKeys,
                round: { broadcastedTxDetails },
            } = action.payload;
            accountKeys.forEach(accountKey => {
                api.dispatch(
                    coinjoinAccountActions.createPendingTransaction(
                        accountKey,
                        broadcastedTxDetails,
                    ),
                );
            });
        }

        // catch prepending tx creation and update accountInfo
        if (
            transactionsActions.addTransaction.match(action) &&
            action.payload.account.accountType === 'coinjoin' &&
            action.payload.transactions.some(tx => 'deadline' in tx)
        ) {
            api.dispatch(
                coinjoinAccountActions.updatePendingAccountInfo(action.payload.account.key),
            );
        }

        if (action.type === SUITE.READY) {
            const state = api.getState();
            const isCoinjoinBlockedByTor = selectIsCoinjoinBlockedByTor(state);
            if (!isCoinjoinBlockedByTor) {
                api.dispatch(coinjoinAccountActions.restoreCoinjoinAccounts());
            }
        }

        if (isAnyOf(discoveryActions.startDiscovery, blockchainActions.synced)(action)) {
            const state = api.getState();
            const symbol =
                action.type === discoveryActions.startDiscovery.type
                    ? undefined
                    : action.payload.symbol;
            const isCoinjoinBlockedByTor = selectIsCoinjoinBlockedByTor(state);
            if (!isCoinjoinBlockedByTor) {
                // find all coinjoin accounts (for specific network when initiating action is network-specific)
                const coinjoinAccounts = state.wallet.accounts.filter(
                    a => a.accountType === 'coinjoin' && (!symbol || a.symbol === symbol),
                );
                coinjoinAccounts.forEach(a =>
                    api.dispatch(coinjoinAccountActions.fetchAndUpdateAccount(a)),
                );
            }
        }

        // Pause coinjoin session when device disconnects.
        // This is not treated a temporary interruption with automatic restore because the user probably disconnects the device willingly.
        if (action.type === DEVICE.DISCONNECT && action.payload.id) {
            api.dispatch(coinjoinAccountActions.stopCoinjoinSessionByDeviceId(action.payload.id));
        }

        // Pause/restore coinjoin session when Suite goes offline/online.
        // This is just UX improvement as the session could not continue offline anyway.
        if (action.type === SUITE.ONLINE_STATUS) {
            if (action.payload === false) {
                if (selectIsAnySessionInCriticalPhase(api.getState())) {
                    api.dispatch(
                        coinjoinClientActions.clientEmitException(
                            'Suite offline in critical phase',
                        ),
                    );
                } else {
                    // pause **only** if not in critical phase
                    api.dispatch(coinjoinAccountActions.pauseAllCoinjoinSessions());
                }
            } else if (action.payload === true) {
                api.dispatch(coinjoinAccountActions.restorePausedCoinjoinSessions());
            }
        }

        // Pause/restore coinjoin session based on Tor status.
        // Continuing coinjoin would be a privacy risk.
        if (action.type === SUITE.TOR_STATUS) {
            if (['Disabling', 'Disabled', 'Error'].includes(action.payload)) {
                if (selectIsAnySessionInCriticalPhase(api.getState())) {
                    api.dispatch(
                        coinjoinClientActions.clientEmitException(
                            `TOR ${action.payload} in critical phase`,
                        ),
                    );
                }
                api.dispatch(coinjoinAccountActions.pauseAllCoinjoinSessions());
            } else if (action.payload === 'Enabled') {
                api.dispatch(coinjoinAccountActions.restorePausedCoinjoinSessions());
            }
        }

        // Pause/restore coinjoin session when an account goes out of sync or in sync.
        // As this is not crucial, it does not pause during the critical phase not to ruin a round.
        if (accountsActions.endCoinjoinAccountSync.match(action)) {
            const state = api.getState();
            const { accountKey, status } = action.payload;
            const session = selectCoinjoinAccountByKey(state, accountKey)?.session;
            if (status === 'out-of-sync' && session && !session?.paused && !session?.starting) {
                const isAccountInCriticalPhase =
                    selectIsAccountWithSessionInCriticalPhaseByAccountKey(state, accountKey);
                if (!isAccountInCriticalPhase) {
                    api.dispatch(coinjoinClientActions.pauseCoinjoinSession(accountKey));
                }
            } else if (status === 'ready' && session?.paused) {
                const account = selectAccountByKey(state, accountKey);
                if (account) {
                    const blocker = selectCoinjoinSessionBlockerByAccountKey(state, account.key);
                    if (!blocker)
                        api.dispatch(coinjoinAccountActions.restoreCoinjoinSession(account.key));
                }
            }
        }

        // Pause/restore coinjoin session depending on current route.
        // Device may be locked by another connect call, so check on LOCK_DEVICE action as well.
        if (action.type === ROUTER.LOCATION_CHANGE || action.type === SUITE.LOCK_DEVICE) {
            const state = api.getState();
            const { locks } = state.suite;
            if (!locks.includes(SUITE.LOCK_TYPE.DEVICE) && !locks.includes(SUITE.LOCK_TYPE.UI)) {
                const previousRoute = state.router.settingsBackRoute.name;
                if (previousRoute === 'wallet-send') {
                    api.dispatch(coinjoinAccountActions.restorePausedCoinjoinSessions());
                } else {
                    const accountKey = state.wallet.selectedAccount.account?.key;
                    if (accountKey) {
                        const session = selectCoinjoinAccountByKey(state, accountKey)?.session;
                        if (
                            state.router.route?.name === 'wallet-send' &&
                            !session?.paused &&
                            !session?.starting
                        ) {
                            api.dispatch(coinjoinClientActions.pauseCoinjoinSession(accountKey));
                        }
                    }
                }
            }
        }

        if (action.type === messageSystemActions.updateValidMessages.type) {
            const state = api.getState();

            const incomingConfig = selectFeatureConfig(state, Feature.coinjoin);

            if (incomingConfig) {
                const { config } = state.wallet.coinjoin;
                const updatedConfig: Partial<typeof config> = {};

                // Iterate over existing config and replace the value from remote config only if it's valid number.
                (Object.keys(config) as Array<keyof CoinjoinConfig>).forEach(key => {
                    const value = incomingConfig[key];

                    if (
                        config[key] !== value &&
                        ((typeof config[key] === 'string' && typeof value === 'string') ||
                            (typeof config[key] !== 'string' && typeof value === 'number'))
                    ) {
                        Object.assign(updatedConfig, { [key]: value });
                    }
                });

                if (Object.keys(updatedConfig).length > 0) {
                    api.dispatch(coinjoinAccountActions.updateCoinjoinConfig(updatedConfig));
                }
            }
        }

        if (
            action.type === messageSystemActions.updateValidMessages.type ||
            action.type === SESSION_ROUND_CHANGED
        ) {
            const state = api.getState();

            const isCoinjoinDisabledByFeatureFlag = selectIsFeatureDisabled(
                state,
                Feature.coinjoin,
            );

            if (isCoinjoinDisabledByFeatureFlag) {
                const isAnySessionInCriticalPhase = selectIsAnySessionInCriticalPhase(state);
                const hasCriticalPhaseJustEnded =
                    action.type === SESSION_ROUND_CHANGED &&
                    action.payload.round.phase === RoundPhase.Ended;

                if (!isAnySessionInCriticalPhase || hasCriticalPhaseJustEnded) {
                    api.dispatch(coinjoinAccountActions.pauseAllCoinjoinSessions());
                }
            }
        }

        if (action.type === SET_DEBUG_SETTINGS) {
            api.dispatch(storageActions.saveCoinjoinDebugSettings());
        }

        if (action.type === COINJOIN.CLIENT_SESSION_PHASE) {
            const { accountKeys } = action.payload;
            const isAlreadyPaused = api
                .getState()
                .wallet.coinjoin.accounts.find(({ key }) => key === accountKeys[0])
                ?.session?.paused;

            if (action.payload.phase === SessionPhase.CriticalError && !isAlreadyPaused) {
                action.payload.accountKeys.forEach(key =>
                    api.dispatch(coinjoinClientActions.pauseCoinjoinSession(key)),
                );
                api.dispatch(addToast({ type: 'coinjoin-interrupted' }));
            }
        }

        return action;
    };
