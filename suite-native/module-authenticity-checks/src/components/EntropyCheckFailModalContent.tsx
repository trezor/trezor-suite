import { Translation } from '@suite-native/intl';
import { ScreenHeader, useInterceptNativeNavigation } from '@suite-native/navigation';
import { HELP_CENTER_ENTROPY_CHECK_URL } from '@trezor/urls';

import { DeviceCompromisedModalContent } from './DeviceCompromisedModalContent';

export const EntropyCheckFailModalContent = () => {
    useInterceptNativeNavigation();

    return (
        <DeviceCompromisedModalContent
            contactSupportUrl={HELP_CENTER_ENTROPY_CHECK_URL}
            screenHeaderContent={<ScreenHeader leftIcon={null} />}
            subtitleContent={
                <Translation id="moduleAuthenticityChecks.deviceCompromised.subtitle.entropy" />
            }
        />
    );
};
