import { Translation } from '@suite/intl';
import { selectScanStatus } from '@suite-common/bluetooth';

import { useSelector } from 'src/hooks/suite';

import { BluetoothDeviceList } from './BluetoothDeviceList';
import { BluetoothTips } from './BluetoothTips';
import { useConnectionGlobalModalContext } from '../../connection/context/ConnectionGlobalModalContext';

export const BluetoothScanningList = () => {
    const scanStatus = useSelector(selectScanStatus);
    const { onReScanClick, devices } = useConnectionGlobalModalContext();

    // This is fake, we scan for devices all the time
    const isScanning = scanStatus === 'running';
    const scanFailed = devices.length === 0 && scanStatus === 'idle';

    const content = scanFailed ? (
        <BluetoothTips
            onReScanClick={onReScanClick}
            header={<Translation id="TR_BLUETOOTH_CHECK_TIPS_TRY_AGAIN" />}
        />
    ) : (
        <BluetoothDeviceList deviceList={devices} isScanning={isScanning} />
    );

    return content;
};
