import { useEffect } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';

import { useRoute } from '@react-navigation/native';

import { selectSelectedDevice } from '@suite-common/device';
import {
    type DiscoveryRootState,
    cancelDiscoveryThunk,
    selectDiscoveryByDevicePath,
} from '@suite-common/wallet-core';
import { events } from '@suite-native/analytics';
import { useNavigateToInitialScreen } from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';

import {
    selectHasPassphraseError,
    selectHasVerificationCancelledError,
    selectPassphraseDiscoveryCompleted,
} from './passphraseSelectors';

export const useRedirectOnPassphraseCompletion = () => {
    const device = useSelector(selectSelectedDevice);

    const passphraseDiscoveryCompleted = useSelector(selectPassphraseDiscoveryCompleted);
    const hasPassphraseError = useSelector(selectHasPassphraseError);
    const hasVerificationCancelledError = useSelector(selectHasVerificationCancelledError);
    const analytics = useAnalytics();
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
            if (discovery) {
                analytics.report({
                    type: events.passphraseFlowFinishedEvent.name,
                    payload: { isEmptyWallet: !discovery.hasLoadedAnyNonEmptyAccount },
                });
            }
        }
    }, [
        passphraseDiscoveryCompleted,
        hasPassphraseError,
        navigateToInitialScreen,
        store,
        device?.path,
        analytics,
    ]);

    useEffect(() => {
        if (hasPassphraseError) {
            navigateToInitialScreen();
        }
    }, [hasPassphraseError, navigateToInitialScreen]);

    useEffect(() => {
        // User has canceled the authorization process on device (authorizeDeviceThunk rejects with auth-failed error)
        if (hasVerificationCancelledError && device) {
            analytics.report({
                type: events.passphraseExitEvent.name,
                payload: { screen: route.name },
            });
            dispatch(cancelDiscoveryThunk(device));
            navigateToInitialScreen();
        }
    }, [
        dispatch,
        hasVerificationCancelledError,
        navigateToInitialScreen,
        route.name,
        device,
        analytics,
    ]);
};
