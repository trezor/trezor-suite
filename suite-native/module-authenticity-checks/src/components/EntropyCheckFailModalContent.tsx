import { useSelector } from 'react-redux';

import { selectIsEntropyCheckEnabledAndFailedForSelectedDevice } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { ScreenHeader, useInterceptNativeNavigation } from '@suite-native/navigation';
import { HELP_CENTER_ENTROPY_CHECK_URL } from '@trezor/urls';

import { CloseButton } from './CloseButton';
import { DeviceCompromisedModalContent } from './DeviceCompromisedModalContent';
import { useCloseDeviceCompromisedScreen } from './useCloseDeviceCompromisedScreen';

export const EntropyCheckFailModalContent = () => {
    useInterceptNativeNavigation();

    const { handleClose } = useCloseDeviceCompromisedScreen();

    const isEntropyCheckFailedForCurrentDevice = useSelector(
        selectIsEntropyCheckEnabledAndFailedForSelectedDevice,
    );
    const canClose = !isEntropyCheckFailedForCurrentDevice;

    return (
        <DeviceCompromisedModalContent
            contactSupportUrl={HELP_CENTER_ENTROPY_CHECK_URL}
            screenHeaderContent={
                canClose ? (
                    <ScreenHeader closeActionType="close" closeAction={handleClose} />
                ) : (
                    <ScreenHeader leftIcon={null} />
                )
            }
            closeButtonContent={canClose ? <CloseButton handleClose={handleClose} /> : null}
            subtitleContent={
                <Translation id="moduleAuthenticityChecks.deviceCompromised.subtitle.entropy" />
            }
        />
    );
};
