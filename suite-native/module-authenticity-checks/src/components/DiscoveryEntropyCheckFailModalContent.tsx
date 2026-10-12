import { Translation } from '@suite-native/intl';
import { ScreenHeader } from '@suite-native/navigation';
import { HELP_CENTER_ENTROPY_CHECK_URL } from '@trezor/urls';

import { CloseButton } from './CloseButton';
import { DeviceCompromisedModalContent } from './DeviceCompromisedModalContent';
import { useCloseDeviceCompromisedScreen } from './useCloseDeviceCompromisedScreen';

// Unlike the wallet creation entropy check, the discovery entropy check is dismissible.
export const DiscoveryEntropyCheckFailModalContent = () => {
    const { handleClose } = useCloseDeviceCompromisedScreen({
        dismissedCheck: 'entropy-discovery',
    });

    return (
        <DeviceCompromisedModalContent
            contactSupportUrl={HELP_CENTER_ENTROPY_CHECK_URL}
            screenHeaderContent={<ScreenHeader closeActionType="close" closeAction={handleClose} />}
            closeButtonContent={<CloseButton handleClose={handleClose} />}
            subtitleContent={
                <Translation id="moduleAuthenticityChecks.deviceCompromised.subtitle.entropy" />
            }
        />
    );
};
