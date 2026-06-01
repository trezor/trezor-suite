import { createThunk } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type DiscoveryCallIds } from '@suite-common/wallet-types';
import TrezorConnect, { UI_EVENT, UI_REQUEST } from '@trezor/connect';
import { type PopupEventMessage, type UiEventMessage } from '@trezor/connect-common';

import { DISCOVERY_MODULE_PREFIX, discoveryActions } from './discoveryActions';
import { isDiscoveryInProgress, selectDiscoveryByDevicePath } from './discoverySelectors';
import { runDiscoveryThunk, startDiscoveryThunk } from './discoveryThunks';
import { defaultTrezorUIEventHandlerThunk } from '../uiEvent/defaultTrezorUIEventHandlerThunk';

const generateDiscoveryCallIds = (): DiscoveryCallIds => ({
    initialDeviceState: crypto.randomUUID(),
    emptyPassphraseCheck: crypto.randomUUID(),
    discoverAccounts: crypto.randomUUID(),
    confirmDeviceState: crypto.randomUUID(),
});

// The "run" step. Exported because for a *new* hidden wallet the run is deferred from
// start — called from PassphraseWalletIsNotExistFlow's "Next" once the user confirms
// best practices (and reused internally for the existing-wallet flow below).
export const runPassphraseWalletAddingDiscoveryThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/runPassphraseWalletAddingDiscovery`,
    async ({ device }: { device: TrezorDevice }, { dispatch }) => {
        const callIds = generateDiscoveryCallIds();
        const scopedCallIdSet = new Set<string>(Object.values(callIds));
        const onUiEvent = (message: UiEventMessage | PopupEventMessage) => {
            const { event: _, ...action } = message;
            if (!('callId' in action) || !action.callId) return;
            if (!scopedCallIdSet.has(action.callId)) return;
            if (action.type === UI_REQUEST.REQUEST_PASSPHRASE) return;
            dispatch(defaultTrezorUIEventHandlerThunk(action));
        };

        TrezorConnect.on(UI_EVENT, onUiEvent);
        try {
            await dispatch(runDiscoveryThunk({ device, callIds })).unwrap();
        } finally {
            TrezorConnect.off(UI_EVENT, onUiEvent);
        }
    },
);

// Internal: for an *existing* hidden wallet, starts and runs immediately (no
// best-practices step to wait for). Only called by startAddWalletDiscoveryThunk.
const startDiscoveryOfExistingPassphraseWalletThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/startDiscoveryOfExistingPassphraseWallet`,
    (
        {
            device,
            isAddingHiddenWallet,
            useScopedCallIds,
        }: {
            device: TrezorDevice;
            isAddingHiddenWallet?: boolean;
            useScopedCallIds?: boolean;
        },
        { dispatch, getState },
    ): void => {
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
export const startAddWalletDiscoveryThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/startAddWalletDiscovery`,
    (
        {
            device,
            isAddingHiddenWallet,
            isAddingExistingWallet,
        }: {
            device: TrezorDevice;
            isAddingHiddenWallet?: boolean;
            isAddingExistingWallet?: boolean;
        },
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
