import { useSelector } from 'react-redux';

import { deviceActions, selectSelectedDevice } from '@suite-common/device';
import { useDispatch } from '@suite-common/redux-utils';
import { Translation } from '@suite-native/intl';
import { ScreenHeader, useNavigateToInitialScreen } from '@suite-native/navigation';
import { TREZOR_SUPPORT_DEVICE_AUTHENTICATION_FAILED_MOBILE_URL } from '@trezor/urls';

import { DeviceCompromisedModalContent } from './DeviceCompromisedModalContent';

export const DeviceAuthenticityCheckFailModalContent = () => {
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const selectedDevice = useSelector(selectSelectedDevice);
    const dispatch = useDispatch();

    const handleClose = () => {
        if (selectedDevice) {
            dispatch(deviceActions.deviceDisconnect(selectedDevice));
        }
        navigateToInitialScreen();
    };

    const screenHeaderContent = <ScreenHeader closeActionType="close" closeAction={handleClose} />;

    return (
        <DeviceCompromisedModalContent
            contactSupportUrl={TREZOR_SUPPORT_DEVICE_AUTHENTICATION_FAILED_MOBILE_URL}
            screenHeaderContent={screenHeaderContent}
            subtitleContent={
                <Translation id="moduleAuthenticityChecks.deviceCompromised.subtitle.deviceAuthenticity" />
            }
        />
    );
};
