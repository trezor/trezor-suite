import { Translation } from '@suite-native/intl';
import { ScreenHeader } from '@suite-native/navigation';
import { TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_MOBILE_URL } from '@trezor/urls';

import { CloseButton } from './CloseButton';
import { DeviceCompromisedModalContent } from './DeviceCompromisedModalContent';
import { useCloseFirmwareChecksFailScreen } from './useCloseFirmwareChecksFailScreen';

export const FirmwareAuthenticityCheckFailModalContent = () => {
    const { canClose, handleClose } = useCloseFirmwareChecksFailScreen();

    return (
        <DeviceCompromisedModalContent
            contactSupportUrl={TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_MOBILE_URL}
            screenHeaderContent={
                canClose ? (
                    <ScreenHeader closeActionType="close" closeAction={handleClose} />
                ) : (
                    <ScreenHeader leftIcon={null} />
                )
            }
            closeButtonContent={canClose ? <CloseButton handleClose={handleClose} /> : null}
            subtitleContent={
                <Translation id="moduleAuthenticityChecks.deviceCompromised.subtitle.fwRevision" />
            }
        />
    );
};
