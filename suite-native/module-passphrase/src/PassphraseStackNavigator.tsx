import { type ReactNode, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useRoute } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useServices } from '@suite-common/dependency-injection';
import { selectSelectedDevice } from '@suite-common/device';
import { cancelDiscoveryThunk, selectDiscoveryForSelectedDevice } from '@suite-common/wallet-core';
import type { DiscoveryStatus } from '@suite-common/wallet-types';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import {
    type PassphraseStackParamList,
    PassphraseStackRoutes,
    stackNavigationOptionsConfig,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { PassphraseDuplicateAlert } from '@suite-native/passphrase';
import { exhaustive } from '@trezor/type-utils';

import { useHandlePassphraseFlowDone } from './hooks/useHandlePassphraseFlowDone';
import { PassphraseConfirmOnTrezorScreen } from './screens/PassphraseConfirmOnTrezorScreen';
import { PassphraseEmptyWalletScreen } from './screens/PassphraseEmptyWalletScreen';
import { PassphraseEnterOnTrezorScreen } from './screens/PassphraseEnterOnTrezorScreen';
import { PassphraseFormScreen } from './screens/PassphraseFormScreen';
import { PassphraseLoadingScreen } from './screens/PassphraseLoadingScreen';
import { PassphraseVerifyEmptyWalletScreen } from './screens/PassphraseVerifyEmptyWalletScreen';
import { PassphraseMismatchAlertScreen } from './screens/usePassphraseMismatchAlert';

const PassphraseStack = createNativeStackNavigator<PassphraseStackParamList>();

const renderPassphraseStackScreens = ({
    passphraseState,
    onPassphraseFlowSuccess,
    onPassphraseFlowFail,
}: {
    passphraseState: DiscoveryStatus['status'];
    onPassphraseFlowSuccess: () => void;
    onPassphraseFlowFail: () => void;
}): ReactNode => {
    switch (passphraseState) {
        case 'starting':
        case 'enter-passphrase':
            return (
                <>
                    <PassphraseStack.Screen
                        name={PassphraseStackRoutes.PassphraseForm}
                        component={PassphraseFormScreen}
                    />
                    <PassphraseStack.Screen
                        name={PassphraseStackRoutes.PassphraseConfirmOnTrezor}
                        component={PassphraseConfirmOnTrezorScreen}
                    />
                    <PassphraseStack.Screen
                        name={PassphraseStackRoutes.PassphraseEnterOnTrezor}
                        component={PassphraseEnterOnTrezorScreen}
                    />
                </>
            );

        case 'progress':
            return (
                <PassphraseStack.Screen
                    name={PassphraseStackRoutes.PassphraseLoading}
                    component={PassphraseLoadingScreen}
                />
            );

        case 'confirm-empty-passphrase':
            return (
                <>
                    <PassphraseStack.Screen
                        name={PassphraseStackRoutes.PassphraseEmptyWallet}
                        component={PassphraseEmptyWalletScreen}
                    />
                    {/* The PassphraseVerifyEmptyWallet screen is shown when user confirms they want to use an empty passphrase. */}
                    <PassphraseStack.Screen
                        name={PassphraseStackRoutes.PassphraseVerifyEmptyWallet}
                        component={PassphraseVerifyEmptyWalletScreen}
                    />
                    <PassphraseStack.Screen
                        name={PassphraseStackRoutes.PassphraseConfirmOnTrezor}
                        component={PassphraseConfirmOnTrezorScreen}
                    />
                    <PassphraseStack.Screen
                        name={PassphraseStackRoutes.PassphraseEnterOnTrezor}
                        component={PassphraseEnterOnTrezorScreen}
                    />
                </>
            );

        case 'passphrase-mismatch':
            return (
                <PassphraseStack.Screen
                    name={PassphraseStackRoutes.PassphraseMismatchAlert}
                    component={PassphraseMismatchAlertScreen}
                />
            );

        case 'passphrase-duplicate':
            return (
                <PassphraseStack.Screen
                    name={PassphraseStackRoutes.PassphraseDuplicateAlert}
                    component={function PassphraseDuplicateAlertScreen() {
                        return (
                            <PassphraseDuplicateAlert>
                                <PassphraseLoadingScreen />
                            </PassphraseDuplicateAlert>
                        );
                    }}
                />
            );

        case 'cancelled':
        case 'failed':
            onPassphraseFlowFail();
            break;
        case 'complete':
            onPassphraseFlowSuccess();
            break;

        default:
            return exhaustive(passphraseState);
    }
};

export const PassphraseStackNavigator = () => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const discovery = useSelector(selectDiscoveryForSelectedDevice);
    const dispatch = useDispatch();
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const onPassphraseFlowSuccess = useHandlePassphraseFlowDone();
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const route = useRoute();
    const passphraseState = discovery?.status;

    const onPassphraseFlowFail = useCallback(() => {
        if (passphraseState === 'cancelled' && selectedDevice) {
            analytics.report({
                type: events.passphraseExitEvent.name,
                payload: { screen: route.name },
            });
            dispatch(cancelDiscoveryThunk(selectedDevice));
        }

        navigateToInitialScreen();
    }, [analytics, dispatch, navigateToInitialScreen, passphraseState, route.name, selectedDevice]);

    if (!selectedDevice || !discovery || !passphraseState) return null;

    return (
        <PassphraseStack.Navigator
            screenOptions={{ ...stackNavigationOptionsConfig, gestureEnabled: false }}
        >
            {renderPassphraseStackScreens({
                passphraseState,
                onPassphraseFlowFail,
                onPassphraseFlowSuccess: () => {
                    navigateToInitialScreen();
                    onPassphraseFlowSuccess();
                },
            })}
        </PassphraseStack.Navigator>
    );
};
