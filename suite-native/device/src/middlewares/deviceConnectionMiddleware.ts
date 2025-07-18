import {
    Dispatch,
    ListenerEffectAPI,
    UnknownAction,
    createListenerMiddleware,
} from '@reduxjs/toolkit';

import {
    deviceConnectThunks,
    selectIsDeviceInitialized,
    selectIsDeviceUsingPassphrase,
} from '@suite-common/wallet-core';
import {
    AuthorizeDeviceStackRoutes,
    RootStackRoutes,
    navigationContainerRef,
} from '@suite-native/navigation';
import { selectIsCoinEnablingInitFinished } from '@suite-native/settings';

import { NativeDeviceRootState, selectIsDeviceCompromised } from '../selectors';

export const deviceConnectionMiddleware = createListenerMiddleware<NativeDeviceRootState>();

const connectDevice = ({ isCoinEnablingInitFinished }: { isCoinEnablingInitFinished: boolean }) => {
    // If coin enabling is not finished, it takes priority over connecting screen
    if (isCoinEnablingInitFinished) {
        navigationContainerRef.navigate(RootStackRoutes.AuthorizeDeviceStack, {
            screen: AuthorizeDeviceStackRoutes.ConnectingDevice,
        });
    } else {
        navigationContainerRef.navigate(RootStackRoutes.CoinEnablingInit);
    }
};

export const startDeviceConnectionListening = () => {
    deviceConnectionMiddleware.startListening({
        predicate: (action, currentState) =>
            deviceConnectThunks.fulfilled.match(action) &&
            // TODO this should dissappear after we merge device onboarding redirect here as well
            // https://github.com/trezor/trezor-suite/issues/20157
            // If device is not initialized and is compromised, we display the modal (reason why this condition is here) and then want to redirect to uninitialized device landing.
            (selectIsDeviceInitialized(currentState) || selectIsDeviceCompromised(currentState)),
        effect: (
            _action,
            { getState }: ListenerEffectAPI<NativeDeviceRootState, Dispatch<UnknownAction>>,
        ) => {
            const isDeviceUsingPassphrase = selectIsDeviceUsingPassphrase(getState());

            // Passphrase protected devices are only connected through passphrase form
            // The passphrase flow handles connection differently and redirect to connecting screen is not wanted.
            if (isDeviceUsingPassphrase) return;

            const shouldNavigateToDeviceCompromisedModal = selectIsDeviceCompromised(getState());
            const isCoinEnablingInitFinished = selectIsCoinEnablingInitFinished(getState());

            if (shouldNavigateToDeviceCompromisedModal) {
                // When the compromised modal is closed on first connection and no coins would be selected, we will need to redirect user
                // to coin enabling so he can continue to the app with running discovery.
                navigationContainerRef.navigate(RootStackRoutes.DeviceCompromisedModal, {
                    onClose: () => {
                        if (!isCoinEnablingInitFinished && selectIsDeviceInitialized(getState())) {
                            connectDevice({
                                isCoinEnablingInitFinished: false,
                            });
                        } else {
                            if (navigationContainerRef.canGoBack()) navigationContainerRef.goBack();
                        }
                    },
                });

                return;
            }

            connectDevice({ isCoinEnablingInitFinished });
        },
    });
};

export const stopDeviceConnectionListening = () => {
    deviceConnectionMiddleware.clearListeners();
};

startDeviceConnectionListening();
