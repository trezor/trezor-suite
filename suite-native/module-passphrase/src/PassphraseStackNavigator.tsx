import { useSelector } from 'react-redux';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { selectSelectedDevice } from '@suite-common/device';
import { selectDiscoveryForSelectedDevice } from '@suite-common/wallet-core';
import {
    type PassphraseStackParamList,
    PassphraseStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';
import {
    PassphraseDuplicateAlert,
    PassphraseFlowDoneRedirect,
    PassphraseMismatchAlert,
    useRedirectOnPassphraseCompletion,
} from '@suite-native/passphrase';

import { PassphraseConfirmOnTrezorScreen } from './screens/PassphraseConfirmOnTrezorScreen';
import { PassphraseEmptyWalletScreen } from './screens/PassphraseEmptyWalletScreen';
import { PassphraseEnterOnTrezorScreen } from './screens/PassphraseEnterOnTrezorScreen';
import { PassphraseFormScreen } from './screens/PassphraseFormScreen';
import { PassphraseLoadingScreen } from './screens/PassphraseLoadingScreen';
import { PassphraseVerifyEmptyWalletScreen } from './screens/PassphraseVerifyEmptyWalletScreen';

export const PassphraseStack = createNativeStackNavigator<PassphraseStackParamList>();

export const PassphraseStackNavigator = () => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const discovery = useSelector(selectDiscoveryForSelectedDevice);

    useRedirectOnPassphraseCompletion();

    if (!selectedDevice || !discovery) return null;

    const passphraseState = discovery.status;

    return (
        <PassphraseStack.Navigator
            screenOptions={{ ...stackNavigationOptionsConfig, gestureEnabled: false }}
        >
            {['starting', 'enter-passphrase'].includes(passphraseState) && (
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
            )}

            {passphraseState === 'progress' && (
                <PassphraseStack.Screen
                    name={PassphraseStackRoutes.PassphraseLoading}
                    component={PassphraseLoadingScreen}
                />
            )}

            {passphraseState === 'confirm-empty-passphrase' && (
                <>
                    <PassphraseStack.Screen
                        name={PassphraseStackRoutes.PassphraseEmptyWallet}
                        component={PassphraseEmptyWalletScreen}
                    />
                    {/* The PassphraseVerifyEmptyWallet screen is shown when user confirms they want to use an empty passphrase */}

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
            )}

            {passphraseState === 'passphrase-mismatch' && (
                <PassphraseStack.Screen
                    name={PassphraseStackRoutes.PassphraseMismatchAlert}
                    component={function PassphraseMismatchAlertScreen() {
                        return (
                            <PassphraseMismatchAlert>
                                <PassphraseLoadingScreen />
                            </PassphraseMismatchAlert>
                        );
                    }}
                />
            )}

            {passphraseState === 'passphrase-duplicate' && (
                <PassphraseStack.Screen
                    name={PassphraseStackRoutes.PassphraseDuplicateAlert}
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
                name={PassphraseStackRoutes.PassphraseRedirecting}
                component={PassphraseFlowDoneRedirect}
            />
        </PassphraseStack.Navigator>
    );
};
