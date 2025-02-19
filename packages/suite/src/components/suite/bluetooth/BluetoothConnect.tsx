import { useCallback, useEffect, useState } from 'react';

import {
    bluetoothConnectDeviceEventAction,
    bluetoothScanStatusAction,
    prepareSelectAllDevices,
    selectAdapterStatus,
    selectScanStatus,
} from '@suite-common/bluetooth';
import { notificationsActions } from '@suite-common/toast-notifications';
import { Card, Column, ElevationUp } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { BluetoothDevice } from '@trezor/transport-bluetooth';
import { TimerId } from '@trezor/type-utils';

import { BluetoothDeviceList } from './BluetoothDeviceList';
import { BluetoothPairingPin } from './BluetoothPairingPin';
import { BluetoothScanFooter } from './BluetoothScanFooter';
import { BluetoothScanHeader } from './BluetoothScanHeader';
import { BluetoothSelectedDevice } from './BluetoothSelectedDevice';
import { BluetoothTips } from './BluetoothTips';
import { BluetoothNotEnabled } from './errors/BluetoothNotEnabled';
import { BluetoothVersionNotCompatible } from './errors/BluetoothVersionNotCompatible';
import { bluetoothConnectDeviceThunk } from '../../../actions/bluetooth/bluetoothConnectDeviceThunk';
import { bluetoothStartScanningThunk } from '../../../actions/bluetooth/bluetoothStartScanningThunk';
import { bluetoothStopScanningThunk } from '../../../actions/bluetooth/bluetoothStopScanningThunk';
import { useDispatch, useSelector } from '../../../hooks/suite';

const SCAN_TIMEOUT = 30_000;

type BluetoothConnectProps = {
    onClose: () => void;
    uiMode: 'spatial' | 'card';
};

const selectAllDevices = prepareSelectAllDevices<BluetoothDevice>();

export const BluetoothConnect = ({ onClose, uiMode }: BluetoothConnectProps) => {
    const dispatch = useDispatch();
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
    const [scannerTimerId, setScannerTimerId] = useState<TimerId | null>(null);

    const bluetoothAdapterStatus = useSelector(selectAdapterStatus);
    const scanStatus = useSelector(selectScanStatus);
    const devices = useSelector(selectAllDevices);

    const selectedDevice =
        selectedDeviceId !== null
            ? devices.find(device => device.device.id === selectedDeviceId)
            : undefined;

    useEffect(() => {
        dispatch(bluetoothStartScanningThunk());

        return () => {
            dispatch(bluetoothStopScanningThunk());
        };
    }, [dispatch]);

    const clearScamTimer = useCallback(() => {
        if (scannerTimerId !== null) {
            clearTimeout(scannerTimerId);
        }
    }, [scannerTimerId]);

    useEffect(() => {
        // Intentionally no `clearScamTimer`, this is first run and if we use this we would create infinite re-render
        const timerId = setTimeout(() => {
            dispatch(bluetoothScanStatusAction({ status: 'idle' }));
        }, SCAN_TIMEOUT);

        setScannerTimerId(timerId);
    }, [dispatch]);

    const onReScanClick = () => {
        setSelectedDeviceId(null);
        dispatch(bluetoothScanStatusAction({ status: 'running' }));

        clearScamTimer();
        const timerId = setTimeout(() => {
            dispatch(bluetoothScanStatusAction({ status: 'idle' }));
        }, SCAN_TIMEOUT);
        setScannerTimerId(timerId);
    };

    const onSelect = async (id: string) => {
        setSelectedDeviceId(id);
        const result = await dispatch(bluetoothConnectDeviceThunk({ id })).unwrap();

        if (!result.success) {
            dispatch(
                bluetoothConnectDeviceEventAction({
                    id,
                    connectionStatus: { type: 'error', error: result.error },
                }),
            );
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: result.error,
                }),
            );
        } else {
            dispatch(
                bluetoothConnectDeviceEventAction({
                    id,
                    connectionStatus: { type: 'connected' },
                }),
            );
        }
    };

    if (bluetoothAdapterStatus === 'disabled') {
        return <BluetoothNotEnabled onCancel={onClose} />;
    }

    // Todo: incompatible version
    const isVersionNotCompatible = false;
    if (isVersionNotCompatible) {
        return <BluetoothVersionNotCompatible onCancel={onClose} />;
    }

    console.log('selectedDevice', selectedDevice);

    // This is fake, we scan for devices all the time
    const isScanning = scanStatus === 'running';
    const scanFailed = devices.length === 0 && scanStatus === 'idle';

    const handlePairingCancel = () => {
        setSelectedDeviceId(null);
        onReScanClick();
    };

    if (
        selectedDevice !== undefined &&
        selectedDevice.status !== null &&
        selectedDevice.status.type === 'pairing' &&
        (selectedDevice.status.pin?.length ?? 0) > 0
    ) {
        return (
            <BluetoothPairingPin
                device={selectedDevice.device}
                pairingPin={selectedDevice.status.pin}
                onCancel={handlePairingCancel}
            />
        );
    }

    if (selectedDevice !== undefined) {
        return <BluetoothSelectedDevice device={selectedDevice} onReScanClick={onReScanClick} />;
    }

    const content = scanFailed ? (
        <BluetoothTips onReScanClick={onReScanClick} header="Check tips & try again" />
    ) : (
        <BluetoothDeviceList
            isDisabled={false}
            onSelect={onSelect}
            deviceList={devices}
            isScanning={isScanning}
        />
    );

    return (
        <Column gap={spacings.sm} flex="1">
            <Card paddingType="none">
                <Column
                    gap={spacings.md}
                    margin={{ vertical: spacings.xxs, horizontal: spacings.xxs }}
                    alignItems="stretch"
                >
                    <BluetoothScanHeader
                        isScanning={isScanning}
                        onClose={onClose}
                        numberOfDevices={devices.length}
                    />

                    {/* Here we need to do +1 in elevation because of custom design on the welcome screen */}
                    {uiMode === 'spatial' ? <ElevationUp>{content}</ElevationUp> : content}

                    {uiMode === 'card' && (
                        <BluetoothScanFooter
                            onReScanClick={onReScanClick}
                            numberOfDevices={devices.length}
                            scanStatus={scanStatus}
                        />
                    )}
                </Column>
            </Card>

            {uiMode === 'spatial' && (
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
            )}
        </Column>
    );
};
