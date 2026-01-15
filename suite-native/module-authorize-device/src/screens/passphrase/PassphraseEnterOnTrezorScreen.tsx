import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { EventType, analytics } from '@suite-native/analytics';
import { Text } from '@suite-native/atoms';
import { selectInputPassphraseOnDevice } from '@suite-native/device-authorization';
import { Translation } from '@suite-native/intl';
import { AuthorizeDeviceStackRoutes, useNavigateToInitialScreen } from '@suite-native/navigation';
import {
    PassphraseContentScreenWrapper,
    PassphraseEnterOnTrezorScreenContent,
} from '@suite-native/passphrase';
import TrezorConnect from '@trezor/connect';

export const PassphraseEnterOnTrezorScreen = () => {
    const inputPassphraseOnDevice = useSelector(selectInputPassphraseOnDevice);
    const navigateToInitialScreen = useNavigateToInitialScreen();

    useEffect(() => {
        if (!inputPassphraseOnDevice) {
            // NOTE: This means that the device passphrase request was fulfilled / rejected.
            navigateToInitialScreen();
        }
    }, [inputPassphraseOnDevice, navigateToInitialScreen]);

    const handleCancel = () => {
        analytics.report({
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
