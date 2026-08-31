import { type AnalyticsDep } from '@suite-common/analytics';
import { type FetchAndSaveMetadataDep } from '@suite-common/metadata-types';
import { type WithServices, createThunk } from '@suite-common/redux-utils';
import { type ConnectInitHooksDeps, type TrezorDevice } from '@suite-common/suite-types';
import { type GetTradedAccountKeysDep } from '@suite-common/wallet-types';
import TrezorConnect, { UI_EVENT, UI_REQUEST } from '@trezor/connect';
import { type PopupEventMessage, type UiEventMessage } from '@trezor/connect-common';

import { DISCOVERY_MODULE_PREFIX, discoveryActions } from './discoveryActions';
import { isDiscoveryInProgress, selectDiscoveryByDevicePath } from './discoverySelectors';
import {
    type RunDiscoveryThunkState,
    type StartDiscoveryThunkDeps,
    type StartDiscoveryThunkState,
    runDiscoveryThunk,
    startDiscoveryThunk,
} from './discoveryThunks';
import { defaultTrezorUIEventHandlerThunk } from '../uiEvent/defaultTrezorUIEventHandlerThunk';
import { registerScopedCallId, unregisterScopedCallId } from '../uiEvent/scopedCallIdRegistry';

type RunPassphraseWalletAddingDiscoveryThunkParams = {
    device: TrezorDevice;
};

type RunPassphraseWalletAddingDiscoveryThunkState = RunDiscoveryThunkState;

type RunPassphraseWalletAddingDiscoveryThunkDeps = WithServices<
    AnalyticsDep & ConnectInitHooksDeps & GetTradedAccountKeysDep
> & {
    thunks: FetchAndSaveMetadataDep;
};

// The "run" step. Exported because for a *new* hidden wallet the run is deferred from
// start — called from PassphraseWalletIsNotExistFlow's "Next" once the user confirms
// best practices (and reused internally for the existing-wallet flow below).
export const runPassphraseWalletAddingDiscoveryThunk = createThunk<
    void,
    RunPassphraseWalletAddingDiscoveryThunkParams,
    {
        state: RunPassphraseWalletAddingDiscoveryThunkState;
        extra: RunPassphraseWalletAddingDiscoveryThunkDeps;
    }
>(
    `${DISCOVERY_MODULE_PREFIX}/runPassphraseWalletAddingDiscovery`,
    async ({ device }, { dispatch }) => {
        const callId = crypto.randomUUID();
        const onUiEvent = (message: UiEventMessage | PopupEventMessage) => {
            const { event: _, ...action } = message;
            if (!('callId' in action) || !action.callId) return;
            if (action.callId !== callId) return;
            if (action.type === UI_REQUEST.REQUEST_PASSPHRASE) return;
            dispatch(defaultTrezorUIEventHandlerThunk(action));
        };

        // Claim this callId so the global handler defers its events to the scoped listener.
        registerScopedCallId(callId);
        TrezorConnect.on(UI_EVENT, onUiEvent);
        try {
            await dispatch(runDiscoveryThunk({ device, callId })).unwrap();
        } finally {
            TrezorConnect.off(UI_EVENT, onUiEvent);
            unregisterScopedCallId(callId);
        }
    },
);

// Internal: for an *existing* hidden wallet, starts and runs immediately (no
// best-practices step to wait for). Only called by startAddWalletDiscoveryThunk.
type StartDiscoveryOfExistingPassphraseWalletThunkPayload = {
    device: TrezorDevice;
    isAddingHiddenWallet?: boolean;
    useScopedCallIds?: boolean;
};

type StartDiscoveryOfExistingPassphraseWalletThunkState = RunDiscoveryThunkState;

type StartDiscoveryOfExistingPassphraseWalletThunkDeps = WithServices<
    AnalyticsDep & ConnectInitHooksDeps & GetTradedAccountKeysDep
> & {
    thunks: FetchAndSaveMetadataDep;
};

const startDiscoveryOfExistingPassphraseWalletThunk = createThunk<
    void,
    StartDiscoveryOfExistingPassphraseWalletThunkPayload,
    {
        state: StartDiscoveryOfExistingPassphraseWalletThunkState;
        extra: StartDiscoveryOfExistingPassphraseWalletThunkDeps;
    }
>(
    `${DISCOVERY_MODULE_PREFIX}/startDiscoveryOfExistingPassphraseWallet`,
    ({ device, isAddingHiddenWallet, useScopedCallIds }, { dispatch, getState }): void => {
        const currentDiscovery = selectDiscoveryByDevicePath(getState(), device.path);

        if (isDiscoveryInProgress(currentDiscovery)) {
            console.warn(
                'startDiscoveryOfExistingPassphraseWalletThunk: discovery already in progress, cancelling start call',
            );

            return;
        }

        dispatch(
            discoveryActions.startDiscovery(device.path, {
                isAddingHiddenWallet,
                isAddingExistingWallet: true,
                useScopedCallIds,
            }),
        );

        if (isAddingHiddenWallet) {
            dispatch(runPassphraseWalletAddingDiscoveryThunk({ device }));
        } else {
            dispatch(runDiscoveryThunk({ device }));
        }
    },
);

// The "start" entry point for the add-wallet buttons. Exported and called from
// AddWalletButton and the retry paths (PassphraseDuplicate / Mismatch / IsNotExist
// modals), which restart the flow. New hidden wallet: only sets state (PassphraseModal
// runs it later); existing hidden / standard wallet: starts the discovery right away.
type StartAddWalletDiscoveryThunkParams = {
    device: TrezorDevice;
    isAddingHiddenWallet?: boolean;
    isAddingExistingWallet?: boolean;
};

type StartAddWalletDiscoveryThunkState = StartDiscoveryOfExistingPassphraseWalletThunkState &
    StartDiscoveryThunkState;

type StartAddWalletDiscoveryThunkDeps = StartDiscoveryOfExistingPassphraseWalletThunkDeps &
    StartDiscoveryThunkDeps;

export const startAddWalletDiscoveryThunk = createThunk<
    void,
    StartAddWalletDiscoveryThunkParams,
    {
        state: StartAddWalletDiscoveryThunkState;
        extra: StartAddWalletDiscoveryThunkDeps;
    }
>(
    `${DISCOVERY_MODULE_PREFIX}/startAddWalletDiscovery`,
    (
        {
            device,
            isAddingHiddenWallet,
            isAddingExistingWallet,
        }: StartAddWalletDiscoveryThunkParams,
        { dispatch },
    ): void => {
        if (isAddingHiddenWallet && isAddingExistingWallet) {
            dispatch(
                startDiscoveryOfExistingPassphraseWalletThunk({
                    device,
                    isAddingHiddenWallet,
                    useScopedCallIds: true,
                }),
            );

            return;
        }

        dispatch(
            startDiscoveryThunk({
                device,
                isAddingHiddenWallet,
                isAddingExistingWallet,
                useScopedCallIds: isAddingHiddenWallet,
            }),
        );
    },
);
