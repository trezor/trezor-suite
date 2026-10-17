import { useSelector } from 'react-redux';

import { deviceActions, selectSelectedDevice } from '@suite-common/device';
import { ejectAllWalletsThunk, startDiscoveryThunk } from '@suite-common/wallet-core';
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

    // Should always be true, but if not, fail-closed by not allowing to dismiss the failed check.
    const canClose = typeof device?.id === 'string';

    const handleClose = () => {
        if (!device?.id) return;

        dispatch(deviceActions.dismissDiscoveryEntropyCheck(device.id));
        // The device returned a wrong xpub, so nothing it has ever returned can be trusted. See the thunk description.
        dispatch(ejectAllWalletsThunk({ device }));

        closeScreen();

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
