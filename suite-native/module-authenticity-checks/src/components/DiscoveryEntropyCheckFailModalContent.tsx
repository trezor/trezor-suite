import { useSelector } from 'react-redux';

import { deviceActions, selectSelectedDevice } from '@suite-common/device';
import { ejectAllWalletsThunk } from '@suite-common/wallet-core';
import { Translation } from '@suite-native/intl';
import { ScreenHeader, useNavigationRemoveActionInterceptor } from '@suite-native/navigation';
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

    // Should always be true, but if not, fail-closed by not allowing to dismiss the failed check.
    // Unlike useCloseFirmwareChecksFailScreen, initialized status plays no role here (this check can only fires on discovery = always initialized).
    const deviceId = device?.id;
    const canClose = typeof deviceId === 'string' && deviceId.length > 0; // matches `getIsDeviceIdValid`

    // Always blocked – even when `canClose`, it can be done only by explicit CTAs, not by native navigation or automatic triggers.
    useNavigationRemoveActionInterceptor({});

    const handleClose = () => {
        if (!canClose || !device) return; // !device just for typescript, but it is guaranteed by canClose
        dispatch(deviceActions.dismissDiscoveryEntropyCheck(deviceId));
        // The device returned a wrong xpub, so nothing it has ever returned can be trusted. See the thunk description.
        dispatch(ejectAllWalletsThunk({ device }));

        closeScreen();
    };

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
