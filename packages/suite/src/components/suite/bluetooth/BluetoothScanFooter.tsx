import { BluetoothScanStatus } from '@suite-common/bluetooth';

import { NotTrezorYouAreLookingFor } from './NotTrezorYouAreLookingFor';

type BluetoothScanFooterProps = {
    onReScanClick: () => void;
    scanStatus: BluetoothScanStatus;
    numberOfDevices: number;
};

export const BluetoothScanFooter = ({
    onReScanClick,
    scanStatus,
    numberOfDevices,
}: BluetoothScanFooterProps) => {
    if (scanStatus === 'idle' && numberOfDevices > 0) {
        return <NotTrezorYouAreLookingFor onReScanClick={onReScanClick} />;
    }

    return null;
};
