import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { selectSelectedDevice } from '@suite-common/device';
import { injectDispatch } from '@suite-common/redux-utils';
import { startDiscoveryThunk } from '@suite-common/wallet-core';
import { Translation } from '@suite-native/intl';
import { ScreenHeader } from '@suite-native/navigation';
import { HELP_CENTER_ENTROPY_CHECK_URL } from '@trezor/urls';

import { CloseButton } from './CloseButton';
import { DeviceCompromisedModalContent } from './DeviceCompromisedModalContent';
import { useCloseDeviceCompromisedScreen } from './useCloseDeviceCompromisedScreen';

// Unlike the wallet creation entropy check, the discovery entropy check is dismissible.
export const DiscoveryEntropyCheckFailModalContent = () => {
    const device = useSelector(selectSelectedDevice);
    const { dispatch } = useServices(injectDispatch);
    const { handleClose } = useCloseDeviceCompromisedScreen({
        dismissedCheck: 'entropy-discovery',
    });
    const closeAndRerunDiscovery = () => {
        handleClose();
        if (!device) return;
        // Force rerun all discovery (not using `startOrRestartDiscoveryThunk`, we don't want to skip already discovered).
        // If the device returns correct xpubs, it may clear the flagged bip44 paths.
        dispatch(
            startDiscoveryThunk({
                device,
                isAddingExistingWallet: true,
                isAddingHiddenWallet: false,
            }),
        );
    };

    return (
        <DeviceCompromisedModalContent
            contactSupportUrl={HELP_CENTER_ENTROPY_CHECK_URL}
            screenHeaderContent={
                <ScreenHeader closeActionType="close" closeAction={closeAndRerunDiscovery} />
            }
            closeButtonContent={<CloseButton handleClose={closeAndRerunDiscovery} />}
            subtitleContent={
                <Translation id="moduleAuthenticityChecks.deviceCompromised.subtitle.entropy" />
            }
        />
    );
};
