import { useDispatch, useSelector } from 'react-redux';

import { deviceActions, selectSelectedDevice } from '@suite-common/wallet-core';
import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { ScreenHeader } from '@suite-native/navigation';
import { TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_MOBILE_URL } from '@trezor/urls';

import { DeviceCompromisedModalContent } from './DeviceCompromisedModalContent';

const supportUrlWithChat = `${TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_MOBILE_URL}#open-chat`;

type FirmwareAuthenticityCheckFailModalContentProps = {
    onCloseRedirect: () => void;
};

export const FirmwareAuthenticityCheckFailModalContent = ({
    onCloseRedirect,
}: FirmwareAuthenticityCheckFailModalContentProps) => {
    const device = useSelector(selectSelectedDevice);
    const dispatch = useDispatch();

    const dismissCheck = () => {
        if (device?.id) {
            dispatch(deviceActions.dismissFirmwareAuthenticityCheck(device.id));
        }
    };

    const handleClose = () => {
        dismissCheck();
        onCloseRedirect();
    };

    const screenHeaderContent = <ScreenHeader closeActionType="close" closeAction={handleClose} />;
    const closeButtonContent = (
        <Button colorScheme="redElevation0" onPress={handleClose}>
            <Translation id="generic.buttons.close" />
        </Button>
    );

    return (
        <DeviceCompromisedModalContent
            contactSupportUrl={supportUrlWithChat}
            screenHeaderContent={screenHeaderContent}
            closeButtonContent={closeButtonContent}
            subtitleContent={
                <Translation id="moduleAuthenticityChecks.deviceCompromised.subtitle.fwRevision" />
            }
        />
    );
};
