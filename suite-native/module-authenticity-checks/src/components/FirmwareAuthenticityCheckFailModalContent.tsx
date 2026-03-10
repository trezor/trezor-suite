import { Translation } from '@suite-native/intl';
import { TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_MOBILE_URL } from '@trezor/urls';

import { DeviceCompromisedModalContent } from './DeviceCompromisedModalContent';
import { useCloseDeviceCompromisedScreen } from './useCloseDeviceCompromisedScreen';

export const FirmwareAuthenticityCheckFailModalContent = () => {
    const { screenHeaderContent, closeButtonContent } = useCloseDeviceCompromisedScreen();

    return (
        <DeviceCompromisedModalContent
            contactSupportUrl={TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_MOBILE_URL}
            screenHeaderContent={screenHeaderContent}
            closeButtonContent={closeButtonContent}
            subtitleContent={
                <Translation id="moduleAuthenticityChecks.deviceCompromised.subtitle.fwRevision" />
            }
        />
    );
};
