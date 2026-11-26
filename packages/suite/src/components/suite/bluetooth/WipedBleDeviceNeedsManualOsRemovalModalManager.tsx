import { selectIsDeviceOsUnpairingRequired } from '@suite-common/bluetooth';
import { ModalLoader } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { lazyComponentByName } from '@trezor/lazy-loading';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from '#src/hooks/suite/useSelector';
import { reportToSentryThunk } from '#src/utils/suite/sentry';

const { LazyComponent: UnpairBluetoothDeviceFromOsModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-connection" */ './UnpairBluetoothDeviceFromOsModal'),
    'UnpairBluetoothDeviceFromOsModal',
);

export const WipedBleDeviceNeedsManualOsRemovalModalManager = () => {
    const { dispatch } = useServices(injectDispatch);
    const wasBluetoothDeviceWiped = useSelector(selectIsDeviceOsUnpairingRequired);

    if (!wasBluetoothDeviceWiped?.isRequired) {
        return null;
    }

    return (
        <ModalLoader
            name="unpair-bluetooth-device-from-os-modal"
            onError={error => dispatch(reportToSentryThunk(error))}
        >
            <UnpairBluetoothDeviceFromOsModal
                skipToggleModalConnection={wasBluetoothDeviceWiped.skipToggleModalConnection}
            />
        </ModalLoader>
    );
};
