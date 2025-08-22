import { useSelector } from 'react-redux';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { selectDiscoveryForSelectedDevice, selectSelectedDevice } from '@suite-common/wallet-core';
import {
    selectCheckPassphraseOnDevice,
    selectDeviceRequestedPin,
    selectInputPassphraseOnDevice,
} from '@suite-native/device-authorization';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { PassphraseDuplicateAlert } from '../components/passphrase/PassphraseDuplicateAlert';
import { PassphraseFlowDoneRedirect } from '../components/passphrase/PassphraseFlowDoneRedirect';
import { PassphraseMismatchAlert } from '../components/passphrase/PassphraseMismatchAlert';
import { PinScreen } from '../screens/connect/PinScreen';
import { PassphraseConfirmOnTrezorScreen } from '../screens/passphrase/PassphraseConfirmOnTrezorScreen';
import { PassphraseEmptyWalletScreen } from '../screens/passphrase/PassphraseEmptyWalletScreen';
import { PassphraseEnableOnDeviceScreen } from '../screens/passphrase/PassphraseEnableOnDeviceScreen';
import { PassphraseEnterOnTrezorScreen } from '../screens/passphrase/PassphraseEnterOnTrezorScreen';
import { PassphraseFormScreen } from '../screens/passphrase/PassphraseFormScreen';
import { PassphraseLoadingScreen } from '../screens/passphrase/PassphraseLoadingScreen';
import { PassphraseVerifyEmptyWalletScreen } from '../screens/passphrase/PassphraseVerifyEmptyWalletScreen';
import { useRedirectOnPassphraseCompletion } from '../useRedirectOnPassphraseCompletion';

export const PassphraseStack = createNativeStackNavigator<AuthorizeDeviceStackParamList>();

export const PassphraseStackNavigator = () => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const discovery = useSelector(selectDiscoveryForSelectedDevice);
    const hasDeviceRequestedPin = useSelector(selectDeviceRequestedPin);
    const inputPassphraseOnDevice = useSelector(selectInputPassphraseOnDevice);

    const checkingOnDevice = useSelector(selectCheckPassphraseOnDevice);

    useRedirectOnPassphraseCompletion();

    if (!selectedDevice || !discovery) return null;

    const passphraseState = checkingOnDevice ? 'passphrase-checking-on-device' : discovery.status;

    return (
        <PassphraseStack.Navigator
            screenOptions={{ ...stackNavigationOptionsConfig, gestureEnabled: false }}
        >
            {hasDeviceRequestedPin && (
                <PassphraseStack.Screen
                    name={AuthorizeDeviceStackRoutes.PinMatrix}
                    component={PinScreen}
                />
            )}
            {inputPassphraseOnDevice && (
                <PassphraseStack.Screen
                    name={AuthorizeDeviceStackRoutes.PassphraseEnterOnTrezor}
                    component={PassphraseEnterOnTrezorScreen}
                />
            )}

            {passphraseState === 'progress' && (
                <PassphraseStack.Screen
                    name={AuthorizeDeviceStackRoutes.PassphraseLoading}
                    component={PassphraseLoadingScreen}
                />
            )}

            {['starting', 'enter-passphrase'].includes(passphraseState) && (
                <PassphraseStack.Screen
                    name={AuthorizeDeviceStackRoutes.PassphraseForm}
                    component={PassphraseFormScreen}
                />
            )}

            {passphraseState === 'confirm-empty-passphrase' && (
                <>
                    <PassphraseStack.Screen
                        name={AuthorizeDeviceStackRoutes.PassphraseEmptyWallet}
                        component={PassphraseEmptyWalletScreen}
                    />
                    {/* The PassphraseVerifyEmptyWallet screen is shown when user confirms they want to use an empty passphrase */}

                    <PassphraseStack.Screen
                        name={AuthorizeDeviceStackRoutes.PassphraseVerifyEmptyWallet}
                        component={PassphraseVerifyEmptyWalletScreen}
                    />
                </>
            )}

            {passphraseState === 'passphrase-mismatch' && (
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

            {passphraseState === 'passphrase-enable-on-device' && (
                <PassphraseStack.Screen
                    name={AuthorizeDeviceStackRoutes.PassphraseEnableOnDevice}
                    component={PassphraseEnableOnDeviceScreen}
                />
            )}
            {passphraseState === 'passphrase-checking-on-device' && (
                <PassphraseStack.Screen
                    name={AuthorizeDeviceStackRoutes.PassphraseConfirmOnTrezor}
                    component={PassphraseConfirmOnTrezorScreen}
                />
            )}
            {passphraseState === 'passphrase-duplicate' && (
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
