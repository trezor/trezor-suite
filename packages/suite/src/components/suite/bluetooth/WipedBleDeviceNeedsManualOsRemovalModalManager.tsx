import { Suspense, lazy } from 'react';

import { selectIsDeviceOsUnpairingRequired } from '@suite-common/bluetooth';
import { ModalSkeleton } from '@trezor/components';

import { useSelector } from '#src/hooks/suite';

const UnpairBluetoothDeviceFromOsModal = lazy(() =>
    import(/* webpackChunkName: "modals-connection" */ './UnpairBluetoothDeviceFromOsModal').then(
        m => ({
            default: m.UnpairBluetoothDeviceFromOsModal,
        }),
    ),
);

export const WipedBleDeviceNeedsManualOsRemovalModalManager = () => {
    const wasBluetoothDeviceWiped = useSelector(selectIsDeviceOsUnpairingRequired);

    if (!wasBluetoothDeviceWiped?.isRequired) {
        return null;
    }

    return (
        <Suspense fallback={<ModalSkeleton />}>
            <UnpairBluetoothDeviceFromOsModal
                skipToggleModalConnection={wasBluetoothDeviceWiped.skipToggleModalConnection}
            />
        </Suspense>
    );
};
