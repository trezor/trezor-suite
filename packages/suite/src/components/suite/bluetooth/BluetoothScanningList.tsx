import { selectScanStatus } from '@suite-common/bluetooth';
import { ElevationUp, Spinner, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { BluetoothDeviceList } from './BluetoothDeviceList';
import { BluetoothDialogCard } from './BluetoothDialogCard';
import { BluetoothScanFooter } from './BluetoothScanFooter';
import { BluetoothTips } from './BluetoothTips';
import { DesktopBluetoothDevice } from '../../../actions/bluetooth/DesktopBluetoothDevice';
import { useSelector } from '../../../hooks/suite';
import { Translation } from '../Translation';

type BluetoothScanningListProps = {
    devices: DesktopBluetoothDevice[];
    uiMode: 'spatial' | 'card';
    onConnect: (deviceId: string) => Promise<void>;
    onClose: () => void;
    onReScanClick: () => void;
};

export const BluetoothScanningList = ({
    devices,
    uiMode,
    onConnect,
    onClose,
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
        <BluetoothDeviceList
            isDisabled={false}
            onConnect={onConnect}
            deviceList={devices}
            isScanning={isScanning}
        />
    );

    return (
        <BluetoothDialogCard
            floatingHeader={uiMode === 'spatial' && <Translation id="TR_CONNECT_VIA_BLUETOOTH" />}
            footer={
                uiMode === 'spatial' && (
                    // Here we need to do +2 in elevation because of custom design on the welcome screen
                    <ElevationUp>
                        <ElevationUp>
                            <BluetoothScanFooter
                                onReScanClick={onReScanClick}
                                numberOfDevices={devices.length}
                                scanStatus={scanStatus}
                            />
                        </ElevationUp>
                    </ElevationUp>
                )
            }
            cardHeader={
                isScanning ? (
                    <>
                        <Spinner isGrey={false} size={spacings.md} />
                        <Translation id="TR_BLUETOOTH_SCANNING" />
                    </>
                ) : (
                    <Text typographyStyle="hint" variant="tertiary">
                        {devices.length > 0 ? (
                            <Translation
                                id="TR_BLUETOOTH_X_TREZORS_FOUND"
                                values={{ number: devices.length }}
                            />
                        ) : (
                            <Translation id="TR_BLUETOOTH_NO_TREZOR_FOUND" />
                        )}
                    </Text>
                )
            }
            headerOnClose={onClose}
        >
            {content}

            {uiMode === 'card' && (
                <BluetoothScanFooter
                    onReScanClick={onReScanClick}
                    numberOfDevices={devices.length}
                    scanStatus={scanStatus}
                />
            )}
        </BluetoothDialogCard>
    );
};
