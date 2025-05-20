import { useEffect } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';

import { useRoute } from '@react-navigation/native';

import {
    DiscoveryRootState,
    cancelDiscoveryThunk,
    selectDiscoveryByDevicePath,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { EventType, analytics } from '@suite-native/analytics';
import {
    selectDiscoveryCompleted,
    selectHasVerificationCancelledError,
    selectPassphraseError,
} from '@suite-native/device-authorization';
import { useNavigateToInitialScreen } from '@suite-native/navigation';

export const useRedirectOnPassphraseCompletion = () => {
    const device = useSelector(selectSelectedDevice);

    const passphraseDiscoveryCompleted = useSelector(selectDiscoveryCompleted);
    const hasPassphraseError = useSelector(selectPassphraseError);
    const hasVerificationCancelledError = useSelector(selectHasVerificationCancelledError);

    const dispatch = useDispatch();
    const store = useStore();
    const navigateToInitialScreen = useNavigateToInitialScreen();

    const route = useRoute();

    useEffect(() => {
        // If there is passphrase error, we don't want to go back, but handle errors through alerts within the flow
        if (passphraseDiscoveryCompleted && !hasPassphraseError) {
            navigateToInitialScreen();

            const discovery = selectDiscoveryByDevicePath(
                store.getState() as DiscoveryRootState,
                device?.path,
            );
            analytics.report({
                type: EventType.PassphraseFlowFinished,
                payload: { isEmptyWallet: Boolean(discovery?.emptyWallet) },
            });
        }
    }, [
        passphraseDiscoveryCompleted,
        hasPassphraseError,
        navigateToInitialScreen,
        store,
        device?.path,
    ]);

    useEffect(() => {
        // User has canceled the authorization process on device (authorizeDeviceThunk rejects with auth-failed error)
        if (hasVerificationCancelledError && device) {
            analytics.report({
                type: EventType.PassphraseExit,
                payload: { screen: route.name },
            });
            dispatch(cancelDiscoveryThunk(device));
            navigateToInitialScreen();
        }
    }, [dispatch, hasVerificationCancelledError, navigateToInitialScreen, route.name, device]);
};
