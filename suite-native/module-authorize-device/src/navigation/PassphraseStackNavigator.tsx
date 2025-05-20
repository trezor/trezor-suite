import { useSelector } from 'react-redux';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    DeviceRootState,
    DiscoveryRootState,
    determinePassphraseFlowState,
    selectDiscoveryByDevicePath,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { DiscoveryStatus } from '@suite-common/wallet-types';
import { selectCheckPassphraseOnDevice } from '@suite-native/device-authorization';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { PassphraseDuplicateAlert } from '../components/passphrase/PassphraseDuplicateAlert';
import { PassphraseFlowDoneRedirect } from '../components/passphrase/PassphraseFlowDoneRedirect';
import { PassphraseMismatchAlert } from '../components/passphrase/PassphraseMismatchAlert';
import { PassphraseConfirmOnTrezorScreen } from '../screens/passphrase/PassphraseConfirmOnTrezorScreen';
import { PassphraseEmptyWalletScreen } from '../screens/passphrase/PassphraseEmptyWalletScreen';
import { PassphraseEnableOnDeviceScreen } from '../screens/passphrase/PassphraseEnableOnDeviceScreen';
import { PassphraseFormScreen } from '../screens/passphrase/PassphraseFormScreen';
import { PassphraseLoadingScreen } from '../screens/passphrase/PassphraseLoadingScreen';
import { PassphraseVerifyEmptyWalletScreen } from '../screens/passphrase/PassphraseVerifyEmptyWalletScreen';
import { useRedirectOnPassphraseCompletion } from '../useRedirectOnPassphraseCompletion';

export const PassphraseStack = createNativeStackNavigator<AuthorizeDeviceStackParamList>();

// Define the state type for our component
type RootState = DiscoveryRootState & DeviceRootState;

const determineNativePassphraseFlowState = (
    discovery: DiscoveryStatus,
    options: {
        checkingOnDevice: boolean;
    },
) => {
    const passphraseState = determinePassphraseFlowState(discovery);

    if (options.checkingOnDevice) {
        return {
            ...passphraseState,
            screen: 'passphrase-checking-on-device',
        };
    }

    if (discovery.status === 'failed') {
        return {
            ...passphraseState,
            screen: 'passphrase-redirecting',
        };
    }

    if (discovery.status === 'complete') {
        return {
            ...passphraseState,
            screen: 'passphrase-complete',
        };
    }

    if (passphraseState?.discovery.status === 'starting') {
        return {
            ...passphraseState,
            screen: 'not-exist-enter-passphrase',
        };
    }

    return passphraseState;
};

export const PassphraseStackNavigator = () => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const discovery = useSelector((state: RootState) =>
        selectDiscoveryByDevicePath(state, selectedDevice?.path),
    );

    const checkingOnDevice = useSelector(selectCheckPassphraseOnDevice);

    useRedirectOnPassphraseCompletion();

    if (!selectedDevice || !discovery) return null;

    // Use the shared determinePassphraseFlowState function to get the current state
    const passphraseState = determineNativePassphraseFlowState(discovery, {
        checkingOnDevice,
    });

    // If there's no passphrase state, don't render anything
    if (!passphraseState) return null;

    return (
        <PassphraseStack.Navigator
            screenOptions={{ ...stackNavigationOptionsConfig, gestureEnabled: false }}
        >
            {passphraseState.screen === 'discovery-loader' && (
                <PassphraseStack.Screen
                    name={AuthorizeDeviceStackRoutes.PassphraseLoading}
                    component={PassphraseLoadingScreen}
                />
            )}

            {(passphraseState.screen === 'not-exist-enter-passphrase' ||
                passphraseState.screen === 'exists-enter-passphrase') && (
                <PassphraseStack.Screen
                    name={AuthorizeDeviceStackRoutes.PassphraseForm}
                    component={PassphraseFormScreen}
                />
            )}

            {(passphraseState.screen === 'not-exist-confirm-passphrase' ||
                passphraseState.screen === 'exists-confirm-passphrase') && (
                <PassphraseStack.Screen
                    name={AuthorizeDeviceStackRoutes.PassphraseEmptyWallet}
                    component={PassphraseEmptyWalletScreen}
                />
            )}

            {(passphraseState.screen === 'not-exist-passphrase-mismatch-warning' ||
                passphraseState.screen === 'exists-passphrase-mismatch-warning') && (
                <PassphraseStack.Screen
                    name={AuthorizeDeviceStackRoutes.PassphraseMismatchAlert}
                    component={function PassphraseMismatchAlertScreen() {
                        return (
                            <PassphraseMismatchAlert>
                                <PassphraseLoadingScreen />
                            </PassphraseMismatchAlert>
                        );
                    }}
                />
            )}

            {passphraseState.screen === 'passphrase-enable-on-device' && (
                <PassphraseStack.Screen
                    name={AuthorizeDeviceStackRoutes.PassphraseEnableOnDevice}
                    component={PassphraseEnableOnDeviceScreen}
                />
            )}

            {/* The PassphraseVerifyEmptyWallet screen is shown when user confirms they want to use an empty passphrase */}
            {(passphraseState.screen === 'not-exist-confirm-passphrase' ||
                passphraseState.screen === 'exists-confirm-passphrase') && (
                <PassphraseStack.Screen
                    name={AuthorizeDeviceStackRoutes.PassphraseVerifyEmptyWallet}
                    component={PassphraseVerifyEmptyWalletScreen}
                />
            )}
            {passphraseState.screen === 'passphrase-checking-on-device' && (
                <PassphraseStack.Screen
                    name={AuthorizeDeviceStackRoutes.PassphraseConfirmOnTrezor}
                    component={PassphraseConfirmOnTrezorScreen}
                />
            )}
            {passphraseState.screen === 'passphrase-duplicate' && (
                <PassphraseStack.Screen
                    name={AuthorizeDeviceStackRoutes.PassphraseDuplicateAlert}
                    component={function PassphraseMismatchAlertScreen() {
                        return (
                            <PassphraseDuplicateAlert>
                                <PassphraseLoadingScreen />
                            </PassphraseDuplicateAlert>
                        );
                    }}
                />
            )}

            {/* This is a catch-all route that handles failures and completion redirects */}
            <PassphraseStack.Screen
                name={AuthorizeDeviceStackRoutes.PassphraseRedirecting}
                component={PassphraseFlowDoneRedirect}
            />
        </PassphraseStack.Navigator>
    );
};
