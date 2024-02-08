import { useEffect, useState } from 'react';

import styled from 'styled-components';

import { Modal, Backdrop, Button } from '@trezor/components';
import { desktopApi } from '@trezor/suite-desktop-api';

interface ElectronBluetoothDevice {
    uuid: string;
    name: string;
}

// const Wrapper = styled.div`
//     height: 100%;
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     justify-content: center;
//     gap: 16px;
// `;

const StyledModal = styled(Modal)`
    // max-width: 600px;
`;

export const BluetoothSelectDevice = () => {
    const [enabled, setEnabled] = useState(false);
    const [bluetoothEnabled, setBluetoothEnabled] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState<any>(undefined);
    const [deviceList, setDeviceList] = useState<ElectronBluetoothDevice[]>([]);

    useEffect(() => {
        desktopApi.on('bluetooth/adapter-event', powered => {
            console.warn('bluetooth/adapter-event', powered);
            setBluetoothEnabled(powered);
            if (!powered) {
                setDeviceList([]);
            }
        });

        desktopApi.on('bluetooth/select-device-event', list => {
            console.warn('bluetooth/select-device-event', list);
            // setEnabled(true);
            setDeviceList(list);
        });

        desktopApi.on('bluetooth/connect-device-event', event => {
            const [status, device] = event;
            console.warn('bluetooth/connect-device-event', status, device);
            setConnectionStatus({ device, status });
            setEnabled(status !== 'connected');
            if (status === 'connected') {
                setEnabled(false);
                setConnectionStatus(undefined);
            } else {
                setEnabled(true);
            }
        });

        return () => {
            desktopApi.removeAllListeners('bluetooth/adapter-event');
            desktopApi.removeAllListeners('bluetooth/select-device-event');
            desktopApi.removeAllListeners('bluetooth/connect-device-event');
        };
    }, []);

    const onSelect = (deviceId?: string) => {
        desktopApi.bluetoothSelectDevice(deviceId);
        setEnabled(false);
    };

    return (
        <>
            {enabled && (
                <Backdrop>
                    <StyledModal
                        currentProgressBarStep={0}
                        totalProgressBarSteps={100}
                        isCancelable
                        onCancel={() => onSelect()}
                    >
                        <div>Select bluetooth device</div>
                        {connectionStatus && <div>{connectionStatus.status}</div>}

                        {!bluetoothEnabled && <div>Bluetooth not enabled</div>}

                        {deviceList.map(d => (
                            <Button key={d.uuid} onClick={() => onSelect(d.uuid)}>
                                {`${d.name} (${d.uuid})`}
                            </Button>
                        ))}
                    </StyledModal>
                </Backdrop>
            )}
        </>
    );
};
