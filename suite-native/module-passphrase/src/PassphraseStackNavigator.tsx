import type { ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { selectSelectedDevice } from '@suite-common/device';
import { selectDiscoveryForSelectedDevice } from '@suite-common/wallet-core';
import type { DiscoveryStatus } from '@suite-common/wallet-types';
import {
    type PassphraseStackParamList,
    PassphraseStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';
import {
    PassphraseDuplicateAlert,
    PassphraseFlowDoneRedirect,
    PassphraseFlowFailedRedirect,
    PassphraseMismatchAlert,
} from '@suite-native/passphrase';
import { exhaustive } from '@trezor/type-utils';

import { PassphraseConfirmOnTrezorScreen } from './screens/PassphraseConfirmOnTrezorScreen';
import { PassphraseEmptyWalletScreen } from './screens/PassphraseEmptyWalletScreen';
import { PassphraseEnterOnTrezorScreen } from './screens/PassphraseEnterOnTrezorScreen';
import { PassphraseFormScreen } from './screens/PassphraseFormScreen';
import { PassphraseLoadingScreen } from './screens/PassphraseLoadingScreen';
import { PassphraseVerifyEmptyWalletScreen } from './screens/PassphraseVerifyEmptyWalletScreen';

const PassphraseStack = createNativeStackNavigator<PassphraseStackParamList>();

const renderPassphraseStackScreens = (passphraseState: DiscoveryStatus['status']): ReactNode => {
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
                    component={function PassphraseMismatchAlertScreen() {
                        return (
                            <PassphraseMismatchAlert>
                                <PassphraseLoadingScreen />
                            </PassphraseMismatchAlert>
                        );
                    }}
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

        case 'complete':
            return (
                <PassphraseStack.Screen
                    name={PassphraseStackRoutes.PassphraseRedirectingSuccess}
                    component={PassphraseFlowDoneRedirect}
                />
            );

        case 'cancelled':
        case 'failed':
            return (
                <PassphraseStack.Screen
                    name={PassphraseStackRoutes.PassphraseRedirectingFailure}
                    component={PassphraseFlowFailedRedirect}
                />
            );

        default:
            return exhaustive(passphraseState);
    }
};

export const PassphraseStackNavigator = () => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const discovery = useSelector(selectDiscoveryForSelectedDevice);

    if (!selectedDevice || !discovery) {
        // TODO revert before merge?
        throw new Error('No device or discovery found.');
    }

    const passphraseState = discovery.status;

    return (
        <PassphraseStack.Navigator
            screenOptions={{ ...stackNavigationOptionsConfig, gestureEnabled: false }}
        >
            {renderPassphraseStackScreens(passphraseState)}
        </PassphraseStack.Navigator>
    );
};
