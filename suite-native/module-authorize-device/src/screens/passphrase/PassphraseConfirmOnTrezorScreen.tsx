import { Screen } from '@suite-native/navigation';
import { PassphraseConfirmOnTrezorScreenContent } from '@suite-native/passphrase';

import { AuthorizeDeviceScreenHeader } from '../../components/AuthorizeDeviceScreenHeader';
import { useHandleNavigateToInitialScreenOnIdle } from '../../hooks/useHandleNavigateToInitialScreenOnIdle';

export const PassphraseConfirmOnTrezorScreen = () => {
    useHandleNavigateToInitialScreenOnIdle();

    return (
        <Screen header={<AuthorizeDeviceScreenHeader />}>
            <PassphraseConfirmOnTrezorScreenContent />
        </Screen>
    );
};
