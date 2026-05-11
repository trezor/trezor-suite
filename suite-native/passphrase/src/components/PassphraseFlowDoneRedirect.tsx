import { type ReactNode, useCallback } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';

import { useFocusEffect, useRoute } from '@react-navigation/native';

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
} from '../passphraseSelectors';

export const PassphraseFlowFailedRedirect = ({ children }: { children?: ReactNode }) => {
    const device = useSelector(selectSelectedDevice);
    const hasVerificationCancelledError = useSelector(selectHasVerificationCancelledError);
    const dispatch = useDispatch();
    const analytics = useAnalytics();
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const route = useRoute();

    useFocusEffect(
        useCallback(() => {
            // TODO is this duplication of discovery status switch/case in the stack navigator?
            // if (hasPassphraseError) {
            if (hasVerificationCancelledError && device) {
                analytics.report({
                    type: events.passphraseExitEvent.name,
                    payload: { screen: route.name },
                });
                dispatch(cancelDiscoveryThunk(device));
            }

            navigateToInitialScreen();
            // }
        }, [
            analytics,
            device,
            dispatch,
            hasVerificationCancelledError,
            navigateToInitialScreen,
            route.name,
        ]),
    );

    return children ?? null;
};
export const PassphraseFlowDoneRedirect = ({ children }: { children?: ReactNode }) => {
    const passphraseDiscoveryCompleted = useSelector(selectPassphraseDiscoveryCompleted);
    const device = useSelector(selectSelectedDevice);
    const analytics = useAnalytics();
    const store = useStore();
    const hasPassphraseError = useSelector(selectHasPassphraseError);
    const navigateToInitialScreen = useNavigateToInitialScreen();

    useFocusEffect(
        useCallback(() => {
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
        ]),
    );

    return children ?? null;
};
