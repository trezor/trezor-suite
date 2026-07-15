import { useServices } from '@suite-common/dependency-injection';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { AuthorizeDeviceStackRoutes, useNavigateToInitialScreen } from '@suite-native/navigation';
import {
    PassphraseContentScreenWrapper,
    PassphraseEnterOnTrezorScreenContent,
} from '@suite-native/passphrase';
import TrezorConnect from '@trezor/connect';

import { AuthorizeDeviceScreenHeader } from '../../components/AuthorizeDeviceScreenHeader';
import { useHandleNavigateToInitialScreenOnIdle } from '../../hooks/useHandleNavigateToInitialScreenOnIdle';

export const PassphraseEnterOnTrezorScreen = () => {
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const { analytics } = useServices(selectNativeAnalyticsDep);

    useHandleNavigateToInitialScreenOnIdle();

    const handleCancel = () => {
        analytics.report({
            type: events.passphraseExitEvent.name,
            payload: { screen: AuthorizeDeviceStackRoutes.PassphraseEnterOnTrezor },
        });
        TrezorConnect.cancel();
        navigateToInitialScreen();
    };

    return (
        <PassphraseContentScreenWrapper
            header={<AuthorizeDeviceScreenHeader />}
            title={<Translation id="modulePassphrase.title" />}
            subtitle={
                <Translation
                    id="modulePassphrase.subtitle"
                    values={{
                        bold: chunks => <Text variant="body-md-strong">{chunks}</Text>,
                    }}
                />
            }
        >
            <PassphraseEnterOnTrezorScreenContent onCancel={handleCancel} />
        </PassphraseContentScreenWrapper>
    );
};
