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
    DeviceOnboardingStackRoutes,
    RootStackRoutes,
    navigationContainerRef,
} from '@suite-native/navigation';
import {
    selectIsCoinEnablingInitFinished,
    selectIsDeviceOnboardingDeviceDisconnectedAlertDisplayed,
} from '@suite-native/settings';

import {
    NativeDeviceRootState,
    selectIsDeviceCompromised,
    selectIsDeviceSetupSupported,
} from '../selectors';

export const deviceConnectionMiddleware = createListenerMiddleware<NativeDeviceRootState>();

const connectDevice = ({
    isCoinEnablingInitFinished,
    isDeviceInitialized,
    isDeviceSetupSupported,
    isOnboardingDeviceDisconnectedAlertDisplayed,
}: {
    isCoinEnablingInitFinished: boolean;
    isDeviceInitialized: boolean;
    isDeviceSetupSupported: boolean;
    isOnboardingDeviceDisconnectedAlertDisplayed: boolean;
}) => {
    if (
        !isDeviceInitialized &&
        isDeviceSetupSupported &&
        !isOnboardingDeviceDisconnectedAlertDisplayed
    ) {
        navigationContainerRef.navigate(RootStackRoutes.DeviceOnboardingStack, {
            screen: DeviceOnboardingStackRoutes.UninitializedDeviceLanding,
        });

        return;
    }

    // If coin enabling is not finished, it takes priority over connecting screen
    if (isCoinEnablingInitFinished) {
        navigationContainerRef.navigate(RootStackRoutes.AuthorizeDeviceStack, {
            screen: AuthorizeDeviceStackRoutes.ConnectingDevice,
        });

        return;
    } else {
        navigationContainerRef.navigate(RootStackRoutes.CoinEnablingInit);

        return;
    }
};

export const startDeviceConnectionListening = () => {
    deviceConnectionMiddleware.startListening({
        predicate: action => deviceConnectThunks.fulfilled.match(action),
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
            const isOnboardingDeviceDisconnectedAlertDisplayed =
                selectIsDeviceOnboardingDeviceDisconnectedAlertDisplayed(getState());

            const isDeviceInitialized = selectIsDeviceInitialized(getState());
            const isDeviceSetupSupported = selectIsDeviceSetupSupported(getState());

            if (shouldNavigateToDeviceCompromisedModal) {
                // When the compromised modal is closed on first connection and no coins would be selected, we will need to redirect user
                // to coin enabling so he can continue to the app with running discovery.
                navigationContainerRef.navigate(RootStackRoutes.DeviceCompromisedModal, {
                    onClose: () => {
                        connectDevice({
                            isCoinEnablingInitFinished: false,
                            isDeviceInitialized,
                            isDeviceSetupSupported,
                            isOnboardingDeviceDisconnectedAlertDisplayed,
                        });
                    },
                });

                return;
            }

            connectDevice({
                isCoinEnablingInitFinished,
                isDeviceInitialized,
                isDeviceSetupSupported,
                isOnboardingDeviceDisconnectedAlertDisplayed,
            });
        },
    });
};

export const stopDeviceConnectionListening = () => {
    deviceConnectionMiddleware.clearListeners();
};

startDeviceConnectionListening();
