import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import { EventType } from '@suite-native/analytics';
import { Text } from '@suite-native/atoms';
import {
    DeviceAuthorizationStep,
    selectDeviceAuthorizationStep,
} from '@suite-native/device-authorization';
import { Translation } from '@suite-native/intl';
import { AuthorizeDeviceStackRoutes, useNavigateToInitialScreen } from '@suite-native/navigation';
import {
    PassphraseContentScreenWrapper,
    PassphraseEnterOnTrezorScreenContent,
} from '@suite-native/passphrase';
import { useLegacyAnalytics } from '@suite-native/services';
import TrezorConnect from '@trezor/connect';

export const PassphraseEnterOnTrezorScreen = () => {
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const legacyAnalytics = useLegacyAnalytics();
    const deviceAuthorizationStep = useSelector(selectDeviceAuthorizationStep);

    useFocusEffect(
        useCallback(() => {
            if (deviceAuthorizationStep === DeviceAuthorizationStep.Idle) {
                // NOTE: this means that the device passphrase request was cancelled on the device so we need to navigate back
                navigateToInitialScreen();
            }
        }, [deviceAuthorizationStep, navigateToInitialScreen]),
    );

    const handleCancel = () => {
        legacyAnalytics.report({
            type: EventType.PassphraseExit,
            payload: { screen: AuthorizeDeviceStackRoutes.PassphraseEnterOnTrezor },
        });
        TrezorConnect.cancel();
        navigateToInitialScreen();
    };

    return (
        <PassphraseContentScreenWrapper
            title={<Translation id="modulePassphrase.title" />}
            subtitle={
                <Translation
                    id="modulePassphrase.subtitle"
                    values={{
                        bold: chunks => <Text variant="highlight">{chunks}</Text>,
                    }}
                />
            }
        >
            <PassphraseEnterOnTrezorScreenContent onCancel={handleCancel} />
        </PassphraseContentScreenWrapper>
    );
};
