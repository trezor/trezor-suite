import {
    Dispatch,
    ListenerEffectAPI,
    UnknownAction,
    createListenerMiddleware,
} from '@reduxjs/toolkit';

import {
    selectIsDeviceConnectedAndAuthorized,
    selectIsDeviceInitialized,
    selectIsDeviceUsingPassphrase,
} from '@suite-common/wallet-core';
import { selectIsFirmwareInstallationRunning } from '@suite-native/firmware';
import {
    AuthorizeDeviceStackRoutes,
    RootStackRoutes,
    checkIsRouteAccessAllowed,
    navigationContainerRef,
} from '@suite-native/navigation';
import { selectIsCoinEnablingInitFinished } from '@suite-native/settings';

import { NativeDeviceRootState, selectIsDeviceCompromised } from '../selectors';
import { isDeviceConnectAction } from '../utils';

const DEVICE_CONNECTION_BLACKLISTED_ROUTES = [
    RootStackRoutes.DeviceCompromisedModal,
    RootStackRoutes.DeviceOnboardingStack,
    RootStackRoutes.SendStack,
];

export const deviceConnectionMiddleware = createListenerMiddleware<NativeDeviceRootState>();

const handleDeviceConnectNavigation = ({
    isCoinEnablingInitFinished,
}: {
    isCoinEnablingInitFinished: boolean;
}) => {
    if (isCoinEnablingInitFinished) {
        navigationContainerRef.navigate(RootStackRoutes.AuthorizeDeviceStack, {
            screen: AuthorizeDeviceStackRoutes.ConnectingDevice,
        });
    } else {
        navigationContainerRef.navigate(RootStackRoutes.CoinEnablingInit);
    }
};

deviceConnectionMiddleware.startListening({
    predicate: (action, currentState) =>
        isDeviceConnectAction(action) &&
        // TODO this should dissappear after we merge device onboarding redirect here as well
        // https://github.com/trezor/trezor-suite/issues/20157
        // If device is not initialized and is compromised, we display the modal (reason why this condition is here) and then want to redirect to uninitialized device landing.
        (selectIsDeviceInitialized(currentState) || selectIsDeviceCompromised(currentState)),
    effect: (
        _action: UnknownAction,
        { getState }: ListenerEffectAPI<NativeDeviceRootState, Dispatch<UnknownAction>>,
    ) => {
        const shouldNavigateToDeviceCompromisedModal = selectIsDeviceCompromised(getState());
        const isCoinEnablingInitFinished = selectIsCoinEnablingInitFinished(getState());

        if (
            !checkIsRouteAccessAllowed({
                blacklist: DEVICE_CONNECTION_BLACKLISTED_ROUTES,
            })
        )
            return;

        // During firmware installation, device restarts (disconnect + connect) and we want to ignore it.
        if (selectIsFirmwareInstallationRunning(getState())) return;

        if (shouldNavigateToDeviceCompromisedModal) {
            // When the compromised modal is closed on first connection and no coins would be selected, we will need to redirect user
            // to coin enabling so he can continue to the app with running discovery.
            navigationContainerRef.navigate(RootStackRoutes.DeviceCompromisedModal);

            return;
        }

        // If device is authorized already (usually in case of remembered device which has already been authorized)
        const isDeviceConnectedAndAuthorized = selectIsDeviceConnectedAndAuthorized(getState());
        // Passphrase protected devices are only connected through passphrase form
        // The passphrase flow handles connection differently and redirect to connecting screen is not wanted.
        const isDeviceUsingPassphrase = selectIsDeviceUsingPassphrase(getState());

        if (isDeviceUsingPassphrase || isDeviceConnectedAndAuthorized) return;

        handleDeviceConnectNavigation({ isCoinEnablingInitFinished });
    },
});
