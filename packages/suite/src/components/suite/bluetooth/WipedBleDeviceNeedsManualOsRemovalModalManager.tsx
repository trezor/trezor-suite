import { selectIsDeviceOsUnpairingRequired } from '@suite-common/bluetooth';
import { useSelector } from '@suite-common/redux-utils';

import { UnpairBluetoothDeviceFromOsModal } from './UnpairBluetoothDeviceFromOsModal';

export const WipedBleDeviceNeedsManualOsRemovalModalManager = () => {
    const wasBluetoothDeviceWiped = useSelector(selectIsDeviceOsUnpairingRequired);

    if (!wasBluetoothDeviceWiped?.isRequired) {
        return null;
    }

    return (
        <UnpairBluetoothDeviceFromOsModal
            skipToggleModalConnection={wasBluetoothDeviceWiped.skipToggleModalConnection}
        />
    );
};
