import { selectIsDeviceOsUnpairingRequired } from '@suite-common/bluetooth';

import { UnpairBluetoothDeviceFromOsModal } from './UnpairBluetoothDeviceFromOsModal';
import { useSelector } from '../../../hooks/suite';

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
