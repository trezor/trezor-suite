import { selectScanStatus } from '@suite-common/bluetooth';

import { BluetoothDeviceList } from './BluetoothDeviceList';
import { BluetoothTips } from './BluetoothTips';
import { DesktopBluetoothDevice } from '../../../actions/bluetooth/DesktopBluetoothDevice';
import { useSelector } from '../../../hooks/suite';
import { Translation } from '../Translation';

type BluetoothScanningListProps = {
    devices: DesktopBluetoothDevice[];
    onConnect: (deviceId: string) => Promise<void>;
    onReScanClick: () => void;
};

export const BluetoothScanningList = ({
    devices,
    onConnect,
    onReScanClick,
}: BluetoothScanningListProps) => {
    const scanStatus = useSelector(selectScanStatus);

    // This is fake, we scan for devices all the time
    const isScanning = scanStatus === 'running';
    const scanFailed = devices.length === 0 && scanStatus === 'idle';

    const content = scanFailed ? (
        <BluetoothTips
            onReScanClick={onReScanClick}
            header={<Translation id="TR_BLUETOOTH_CHECK_TIPS_TRY_AGAIN" />}
        />
    ) : (
        <BluetoothDeviceList onConnect={onConnect} deviceList={devices} isScanning={isScanning} />
    );

    return content;
};
