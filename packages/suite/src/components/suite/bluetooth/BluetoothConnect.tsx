import { useCallback, useEffect, useState } from 'react';

import { notificationsActions } from '@suite-common/toast-notifications';
import { Card, Column, ElevationUp } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { spacings } from '@trezor/theme';
import { TimerId } from '@trezor/type-utils';

import { BluetoothDeviceList } from './BluetoothDeviceList';
import { BluetoothPairingPin } from './BluetoothPairingPin';
import { BluetoothScanFooter } from './BluetoothScanFooter';
import { BluetoothScanHeader } from './BluetoothScanHeader';
import { BluetoothSelectedDevice } from './BluetoothSelectedDevice';
import { BluetoothTips } from './BluetoothTips';
import { BluetoothNotEnabled } from './errors/BluetoothNotEnabled';
import { BluetoothVersionNotCompatible } from './errors/BluetoothVersionNotCompatible';
import {
    bluetoothConnectDeviceEventAction,
    bluetoothScanStatusAction,
} from '../../../actions/bluetooth/bluetoothActions';
import { bluetoothConnectDeviceThunk } from '../../../actions/bluetooth/bluetoothConnectDeviceThunk';
import { bluetoothStartScanningThunk } from '../../../actions/bluetooth/bluetoothStartScanningThunk';
import { bluetoothStopScanningThunk } from '../../../actions/bluetooth/bluetoothStopScanningThunk';
import { useDispatch, useSelector } from '../../../hooks/suite';
import {
    selectBluetoothDeviceList,
    selectBluetoothEnabled,
    selectBluetoothScanStatus,
} from '../../../reducers/bluetooth/bluetoothSelectors';

const SCAN_TIMEOUT = 30_000;

type BluetoothConnectProps = {
    onClose: () => void;
    uiMode: 'spatial' | 'card';
};

export const BluetoothConnect = ({ onClose, uiMode }: BluetoothConnectProps) => {
    const dispatch = useDispatch();
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
    const [scannerTimerId, setScannerTimerId] = useState<TimerId | null>(null);

    const isBluetoothEnabled = useSelector(selectBluetoothEnabled);
    const scanStatus = useSelector(selectBluetoothScanStatus);
    const deviceList = useSelector(selectBluetoothDeviceList);
    const devices = Object.values(deviceList);

    const selectedDevice = selectedDeviceId !== null ? deviceList[selectedDeviceId] ?? null : null;

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
            dispatch(bluetoothScanStatusAction({ status: 'done' }));
        }, SCAN_TIMEOUT);

        setScannerTimerId(timerId);
    }, [dispatch]);

    const onReScanClick = () => {
        setSelectedDeviceId(null);
        dispatch(bluetoothScanStatusAction({ status: 'running' }));

        clearScamTimer();
        const timerId = setTimeout(() => {
            dispatch(bluetoothScanStatusAction({ status: 'done' }));
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
            // Todo: What to do with error in this flow? UI-Wise

            dispatch(
                bluetoothConnectDeviceEventAction({
                    id,
                    connectionStatus: { type: 'connected' },
                }),
            );

            // WAIT for connect event, TODO: figure out better way
            const closePopupAfterConnection = () => {
                TrezorConnect.off('device-connect', closePopupAfterConnection);
                TrezorConnect.off('device-connect_unacquired', closePopupAfterConnection);
                // setSelectedDeviceStatus({ type: 'error', id }); // Todo: what here?
            };
            TrezorConnect.on('device-connect', closePopupAfterConnection);
            TrezorConnect.on('device-connect_unacquired', closePopupAfterConnection);
        }
    };

    if (!isBluetoothEnabled) {
        return <BluetoothNotEnabled onCancel={onClose} />;
    }

    // Todo: incompatible version
    const isVersionNotCompatible = false;
    if (isVersionNotCompatible) {
        return <BluetoothVersionNotCompatible onCancel={onClose} />;
    }

    console.log('selectedDevice', selectedDevice);

    // This is fake, we scan for devices all the time
    const isScanning = scanStatus !== 'done';
    const scanFailed = devices.length === 0 && scanStatus === 'done';

    const handlePairingCancel = () => {
        setSelectedDeviceId(null);
        onReScanClick();
    };

    if (
        selectedDevice !== null &&
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

    if (selectedDevice !== null) {
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
