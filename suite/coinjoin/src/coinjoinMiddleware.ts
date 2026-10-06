import { isAnyOf } from '@reduxjs/toolkit';
import type { MiddlewareAPI, Dispatch as ReduxDispatch, UnknownAction } from 'redux';

import { type SelectedAccountRootState } from '@suite/account';
import { type LocksRootState, lockDevice, selectIsDeviceOrUiLocked } from '@suite/locks';
import { type ModalRootState } from '@suite/modal';
import {
    type RouterRootState,
    routerLocationChange,
    selectRouteName,
    selectSettingsBackRoute,
} from '@suite/router';
import { onSuiteInit, onSuiteReady, updateOnlineStatus } from '@suite/suite-lifecycle';
import { type TorRootState, selectIsTorEnabled, torActions } from '@suite/tor';
import { type DeviceRootState, deviceActions } from '@suite-common/device';
import {
    Feature,
    type MessageSystemRootState,
    messageSystemActions,
    selectFeatureConfig,
    selectIsFeatureDisabled,
} from '@suite-common/message-system';
import { type Dispatch } from '@suite-common/redux-utils';
import { addToast } from '@suite-common/toast-notifications';
import {
    type AccountsRootState,
    accountsActions,
    blockchainActions,
    discoveryActions,
    selectAccountByKey,
    transactionsActions,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { RoundPhase, SessionPhase } from '@trezor/coinjoin';
import { UI_EVENTS, isUiEventOfType } from '@trezor/connect';
import { arrayDistinct, typedObjectKeys } from '@trezor/utils';

import * as coinjoinAccountActions from './coinjoinAccountActions';
import * as coinjoinClientActions from './coinjoinClientActions';
import {
    type CoinjoinRootState,
    type SuiteOnlineRootState,
    selectCoinjoinAccountByKey,
    selectCoinjoinSessionBlockerByAccountKey,
    selectIsAccountWithSessionInCriticalPhaseByAccountKey,
    selectIsAnySessionInCriticalPhase,
} from './coinjoinSelectors';
import { CoinjoinService } from './coinjoinService';
import { isCoinjoinSupportedSymbol } from './coinjoinUtils';

type CoinjoinMiddlewareState = AccountsRootState &
    CoinjoinRootState &
    DeviceRootState &
    LocksRootState &
    MessageSystemRootState &
    ModalRootState &
    RouterRootState &
    SelectedAccountRootState &
    SuiteOnlineRootState &
    TorRootState;

export const coinjoinMiddleware =
    (api: MiddlewareAPI<Dispatch, CoinjoinMiddlewareState>) =>
    (next: ReduxDispatch) =>
    (action: UnknownAction): UnknownAction => {
        // cancel discovery for each CoinjoinBackend
        if (routerLocationChange.match(action) && action.payload.app !== 'wallet') {
            CoinjoinService.getInstances().forEach(({ backend }) => backend.cancel());
        }

        // do not close success and critical phase modals when they are open, similar to discovery middleware
        const { modal } = api.getState();
        const allowedModals = ['coinjoin-success', 'more-rounds-needed', 'critical-coinjoin-phase'];

        if (
            isUiEventOfType(action, UI_EVENTS.CLOSE_UI_WINDOW) &&
            'payload' in modal &&
            allowedModals.includes(modal.payload?.type)
        ) {
            return action;
        }

        if (onSuiteInit.match(action)) {
            api.dispatch(coinjoinAccountActions.logCoinjoinAccountsThunk());
        }

        if (accountsActions.removeAccount.match(action)) {
            action.payload.forEach(account =>
                api.dispatch(coinjoinAccountActions.stopCoinjoinAccountThunk(account)),
            );
        }

        // propagate action to reducers
        next(action);

        if (accountsActions.removeAccount.match(action)) {
            action.payload
                .filter(({ accountType }) => accountType === 'coinjoin')
                .map(({ symbol }) => symbol)
                .filter(arrayDistinct)
                .forEach(
                    symbol =>
                        isCoinjoinSupportedSymbol(symbol) &&
                        api.dispatch(coinjoinAccountActions.clearCoinjoinInstancesThunk(symbol)),
                );
        }

        // catch broadcasted transactions and create prepending transaction(s) for each account
        if (
            coinjoinClientActions.clientSessionTxBroadcasted.match(action) &&
            action.payload.round.broadcastedTxDetails
        ) {
            const {
                accountKeys,
                round: { broadcastedTxDetails },
            } = action.payload;
            accountKeys.forEach((accountKey: string) => {
                api.dispatch(
                    coinjoinAccountActions.createPendingTransactionThunk(
                        accountKey as AccountKey,
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
                coinjoinAccountActions.updatePendingAccountInfoThunk(action.payload.account.key),
            );
        }

        if (onSuiteReady.match(action)) {
            const state = api.getState();
            const isCoinjoinBlockedByTor = !selectIsTorEnabled(state);
            if (!isCoinjoinBlockedByTor) {
                api.dispatch(coinjoinAccountActions.restoreCoinjoinAccountsThunk());
            }
        }

        // todo: startDiscovery is now fired under different context
        if (isAnyOf(discoveryActions.startDiscovery, blockchainActions.synced)(action)) {
            const state = api.getState();
            const symbol = discoveryActions.startDiscovery.match(action)
                ? undefined
                : action.payload.symbol;
            const isCoinjoinBlockedByTor = !selectIsTorEnabled(state);
            if (!isCoinjoinBlockedByTor) {
                // find all coinjoin accounts (for specific network when initiating action is network-specific)
                const coinjoinAccounts = state.wallet.accounts.filter(
                    a => a.accountType === 'coinjoin' && (!symbol || a.symbol === symbol),
                );
                coinjoinAccounts.forEach(a =>
                    api.dispatch(coinjoinAccountActions.fetchAndUpdateAccountThunk(a)),
                );
            }
        }

        // Pause coinjoin session when device disconnects.
        // This is not treated a temporary interruption with automatic restore because the user probably disconnects the device willingly.
        if (deviceActions.deviceDisconnect.match(action) && action.payload.id) {
            api.dispatch(
                coinjoinAccountActions.stopCoinjoinSessionByDeviceIdThunk(action.payload.id),
            );
        }

        // Pause/restore coinjoin session when Suite goes offline/online.
        // This is just UX improvement as the session could not continue offline anyway.
        if (updateOnlineStatus.match(action)) {
            if (action.payload === false) {
                if (selectIsAnySessionInCriticalPhase(api.getState())) {
                    api.dispatch(
                        coinjoinClientActions.clientEmitException(
                            'Suite offline in critical phase',
                        ),
                    );
                } else {
                    // pause **only** if not in critical phase
                    api.dispatch(coinjoinAccountActions.pauseAllCoinjoinSessionsThunk());
                }
            } else if (action.payload === true) {
                api.dispatch(coinjoinAccountActions.restorePausedCoinjoinSessionsThunk());
            }
        }

        // Pause/restore coinjoin session based on Tor status.
        // Continuing coinjoin would be a privacy risk.
        if (torActions.setTorStatus.match(action)) {
            if (['Disabling', 'Disabled', 'Error'].includes(action.payload)) {
                if (selectIsAnySessionInCriticalPhase(api.getState())) {
                    api.dispatch(
                        coinjoinClientActions.clientEmitException(
                            `TOR ${action.payload} in critical phase`,
                        ),
                    );
                }
                api.dispatch(coinjoinAccountActions.pauseAllCoinjoinSessionsThunk());
            } else if (action.payload === 'Enabled') {
                api.dispatch(coinjoinAccountActions.restorePausedCoinjoinSessionsThunk());
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
                    api.dispatch(coinjoinClientActions.pauseCoinjoinSessionThunk(accountKey));
                }
            } else if (status === 'ready' && session?.paused) {
                const account = selectAccountByKey(state, accountKey);
                if (account) {
                    const blocker = selectCoinjoinSessionBlockerByAccountKey(state, account.key);
                    if (!blocker)
                        api.dispatch(
                            coinjoinAccountActions.restoreCoinjoinSessionThunk(account.key),
                        );
                }
            }
        }

        // Pause/restore coinjoin session depending on current route.
        // Device may be locked by another connect call, so check on LOCK_DEVICE action as well.
        if (routerLocationChange.match(action) || lockDevice.match(action)) {
            const state = api.getState();
            const isDeviceOrUiLocked = selectIsDeviceOrUiLocked(state);
            if (!isDeviceOrUiLocked) {
                const previousRoute = selectSettingsBackRoute(state).name;
                if (previousRoute === 'wallet-send') {
                    api.dispatch(coinjoinAccountActions.restorePausedCoinjoinSessionsThunk());
                } else {
                    const accountKey = state.wallet.selectedAccount.account?.key;
                    if (accountKey) {
                        const session = selectCoinjoinAccountByKey(state, accountKey)?.session;
                        if (
                            selectRouteName(state) === 'wallet-send' &&
                            !session?.paused &&
                            !session?.starting
                        ) {
                            api.dispatch(
                                coinjoinClientActions.pauseCoinjoinSessionThunk(accountKey),
                            );
                        }
                    }
                }
            }
        }

        if (messageSystemActions.updateValidMessages.match(action)) {
            const state = api.getState();

            const incomingConfig = selectFeatureConfig(state, Feature.coinjoin);

            if (incomingConfig) {
                const { config } = state.wallet.coinjoin;
                const updatedConfig: Partial<typeof config> = {};

                // Iterate over existing config and replace the value from remote config only if it's valid number.
                typedObjectKeys(config).forEach(key => {
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
            messageSystemActions.updateValidMessages.match(action) ||
            coinjoinClientActions.clientSessionRoundChanged.match(action)
        ) {
            const state = api.getState();

            const isCoinjoinDisabledByFeatureFlag = selectIsFeatureDisabled(
                state,
                Feature.coinjoin,
            );

            if (isCoinjoinDisabledByFeatureFlag) {
                const isAnySessionInCriticalPhase = selectIsAnySessionInCriticalPhase(state);
                const hasCriticalPhaseJustEnded =
                    coinjoinClientActions.clientSessionRoundChanged.match(action) &&
                    action.payload.round.phase === RoundPhase.Ended;

                if (!isAnySessionInCriticalPhase || hasCriticalPhaseJustEnded) {
                    api.dispatch(coinjoinAccountActions.pauseAllCoinjoinSessionsThunk());
                }
            }
        }

        if (coinjoinClientActions.clientSessionPhase.match(action)) {
            const { accountKeys } = action.payload;
            const isAlreadyPaused = api
                .getState()
                .wallet.coinjoin.accounts.find(({ key }) => key === accountKeys[0])
                ?.session?.paused;

            if (action.payload.phase === SessionPhase.CriticalError && !isAlreadyPaused) {
                action.payload.accountKeys.forEach((key: string) =>
                    api.dispatch(
                        coinjoinClientActions.pauseCoinjoinSessionThunk(key as AccountKey),
                    ),
                );
                api.dispatch(addToast({ type: 'coinjoin-interrupted' }));
            }
        }

        return action;
    };
