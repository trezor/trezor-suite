import { UnpairBluetoothDeviceFromOsModal } from './UnpairBluetoothDeviceFromOsModal';
import { selectUnpairedDeviceNeedsManualOsRemoval } from '../../../actions/bluetooth/desktopBluetoothSelectors';
import { useSelector } from '../../../hooks/suite';

export const WipedBleDeviceNeedsManualOsRemovalModalManager = () => {
    const wasBluetoothDeviceWiped = useSelector(selectUnpairedDeviceNeedsManualOsRemoval);

    if (!wasBluetoothDeviceWiped) {
        return null;
    }

    return <UnpairBluetoothDeviceFromOsModal />;
};
