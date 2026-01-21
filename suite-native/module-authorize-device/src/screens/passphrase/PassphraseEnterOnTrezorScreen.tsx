import { EventType } from '@suite-native/analytics';
import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { AuthorizeDeviceStackRoutes, useNavigateToInitialScreen } from '@suite-native/navigation';
import {
    PassphraseContentScreenWrapper,
    PassphraseEnterOnTrezorScreenContent,
} from '@suite-native/passphrase';
import { useLegacyAnalytics } from '@suite-native/services';
import TrezorConnect from '@trezor/connect';

import { useHandleNavigateToInitialScreenOnIdle } from '../../hooks/useHandleNavigateToInitialScreenOnIdle';

export const PassphraseEnterOnTrezorScreen = () => {
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const legacyAnalytics = useLegacyAnalytics();

    useHandleNavigateToInitialScreenOnIdle();

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
