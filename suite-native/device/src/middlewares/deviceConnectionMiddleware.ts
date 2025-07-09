import {
    Dispatch,
    ListenerEffectAPI,
    UnknownAction,
    createListenerMiddleware,
} from '@reduxjs/toolkit';

import {
    deviceConnectThunks,
    selectIsDeviceConnectedAndAuthorized,
    selectIsDeviceInitialized,
    selectIsDeviceUsingPassphrase,
} from '@suite-common/wallet-core';
import {
    AuthorizeDeviceStackRoutes,
    RootStackRoutes,
    navigationContainerRef,
} from '@suite-native/navigation';
import {
    selectIsCoinEnablingInitFinished,
    selectIsOnboardingFinished,
} from '@suite-native/settings';

import {
    NativeDeviceRootState,
    selectCompromisedDeviceFailedCheck,
    selectIsDeviceCompromised,
} from '../selectors';

export const deviceConnectionMiddleware = createListenerMiddleware<NativeDeviceRootState>();

// At the moment when unauthorized physical device is selected,
// redirect to the Connecting screen where is handled the connection logic.
export const deviceConnectionPredicate = (
    action: UnknownAction,
    currentState: NativeDeviceRootState,
) =>
    deviceConnectThunks.fulfilled.match(action) &&
    selectIsOnboardingFinished(currentState) &&
    selectIsDeviceInitialized(currentState);

export const deviceConnectionEffect = (
    _: UnknownAction,
    { getState }: ListenerEffectAPI<NativeDeviceRootState, Dispatch<UnknownAction>>,
) => {
    const isDeviceUsingPassphrase = selectIsDeviceUsingPassphrase(getState());
    // Passphrase protected devices are only connected through passphrase form (in app / in device)
    // The passphrase flow handles connection differently and redirect to connecting screen is not wanted.
    if (isDeviceUsingPassphrase) return;

    const isDeviceConnectedAndAuthorized = selectIsDeviceConnectedAndAuthorized(getState());
    // Probably doesn't need to be here. It was added when authorizeDeviceThunk was called from useEffect
    // inside useHandleDeviceConnection. Now the device is authorized regardless and I think we can navigate
    // since it was because of biometrics and those are handled separately.
    // Reference https://github.com/trezor/trezor-suite/pull/11319/commits/a9152279fe6d70c57fa16ee0bf75dc9fd52bb930
    if (isDeviceConnectedAndAuthorized) return;

    const shouldNavigateToDeviceCompromisedModal = selectIsDeviceCompromised(getState());
    if (shouldNavigateToDeviceCompromisedModal) {
        const compromisedDeviceFailedCheck = selectCompromisedDeviceFailedCheck(getState());
        navigationContainerRef.navigate(RootStackRoutes.DeviceCompromisedModal, {
            failedCheck: compromisedDeviceFailedCheck,
        });

        return;
    }

    const isCoinEnablingInitFinished = selectIsCoinEnablingInitFinished(getState());
    if (isCoinEnablingInitFinished) {
        navigationContainerRef.navigate(RootStackRoutes.AuthorizeDeviceStack, {
            screen: AuthorizeDeviceStackRoutes.ConnectingDevice,
        });
    } else {
        navigationContainerRef.navigate(RootStackRoutes.CoinEnablingInit);
    }
};

export const stopDeviceConnectionListening = () => {
    deviceConnectionMiddleware.stopListening({
        predicate: deviceConnectionPredicate,
        effect: deviceConnectionEffect,
        cancelActive: true,
    });
};

export const restartDeviceConnectionListening = () => {
    deviceConnectionMiddleware.startListening({
        predicate: deviceConnectionPredicate,
        effect: deviceConnectionEffect,
    });
};

deviceConnectionMiddleware.startListening({
    predicate: deviceConnectionPredicate,
    effect: deviceConnectionEffect,
});
