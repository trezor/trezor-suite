import { Translation } from '@suite-native/intl';
import { ScreenHeader } from '@suite-native/navigation';
import { TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_MOBILE_URL } from '@trezor/urls';

import { CloseButton } from './CloseButton';
import { DeviceCompromisedModalContent } from './DeviceCompromisedModalContent';
import { useCloseDeviceCompromisedScreen } from './useCloseDeviceCompromisedScreen';

export const DeviceInvariabilityCheckFailModalContent = () => {
    const { handleClose } = useCloseDeviceCompromisedScreen();

    return (
        <DeviceCompromisedModalContent
            contactSupportUrl={TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_MOBILE_URL}
            screenHeaderContent={<ScreenHeader closeActionType="close" closeAction={handleClose} />}
            closeButtonContent={<CloseButton handleClose={handleClose} />}
            subtitleContent={
                <Translation id="moduleAuthenticityChecks.deviceCompromised.subtitle.invariability" />
            }
        />
    );
};
