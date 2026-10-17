import { useSelector } from 'react-redux';

import { deviceActions, selectSelectedDevice } from '@suite-common/device';
import { ejectAllWalletsThunk } from '@suite-common/wallet-core';
import { Translation } from '@suite-native/intl';
import { ScreenHeader } from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';
import { HELP_CENTER_ENTROPY_CHECK_URL } from '@trezor/urls';

import { CloseButton } from './CloseButton';
import { DeviceCompromisedModalContent } from './DeviceCompromisedModalContent';
import { useCloseDeviceCompromisedScreen } from './useCloseDeviceCompromisedScreen';

// Unlike the wallet creation entropy check, the discovery entropy check is dismissible.
export const DiscoveryEntropyCheckFailModalContent = () => {
    const device = useSelector(selectSelectedDevice);
    const { dispatch } = useServices(injectDispatch);
    const { handleClose: closeScreen } = useCloseDeviceCompromisedScreen();

    const handleClose = () => {
        if (device?.id) {
            dispatch(deviceActions.dismissDiscoveryEntropyCheck(device.id));
            // The device returned a wrong xpub, so nothing it has ever returned can be trusted. See the thunk description.
            dispatch(ejectAllWalletsThunk({ device }));
        }

        closeScreen();
    };

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
