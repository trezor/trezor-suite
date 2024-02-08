import { useEffect, useState } from 'react';
import styled from 'styled-components';

import TrezorConnect from '@trezor/connect';
import { Button, Spinner } from '@trezor/components';
import { desktopApi } from '@trezor/suite-desktop-api';
import { UserContextPayload } from '@suite-common/suite-types';

import { Modal } from 'src/components/suite';

const SmallModal = styled(Modal)`
    width: 560px;
    min-height: 300px;
`;

const Loader = styled.div`
    display: flex;
    flex-direction: row;
`;

const StyledSpinner = styled(Spinner)`
    margin-right: 12px;
`;

const DeviceList = styled.div`
    padding: 8px;
`;

const DeviceListItem = styled(Button)`
    margin: 8px 0px;
    width: 100%;
`;

type SelectBluetoothDeviceProps = Omit<
    Extract<UserContextPayload, { type: 'select-bluetooth-device' }>,
    'type'
> & {
    onCancel: () => void;
};

interface ElectronBluetoothDevice {
    uuid: string;
    name: string;
}

export const SelectBluetoothDeviceModal = ({ onCancel }: SelectBluetoothDeviceProps) => {
    const [isBluetoothEnabled, setBluetoothEnabled] = useState(true);
    const [connectingStatus, setConnectingStatus] = useState<any>(undefined);
    const [deviceList, setDeviceList] = useState<ElectronBluetoothDevice[]>([]);

    console.warn('SELECT MODAL');
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
            setDeviceList(list);
        });

        desktopApi.on('bluetooth/connect-device-event', ({ device, phase }) => {
            console.warn('bluetooth/connect-device-event', phase, device);
            setConnectingStatus({ device, status: phase });
            if (phase === 'connected') {
                TrezorConnect.on('device-connect', () => {
                    onCancel();
                });
            }
            if (phase === 'error') {
            }
        });

        desktopApi.bluetoothRequestDevice();

        return () => {
            desktopApi.removeAllListeners('bluetooth/adapter-event');
            desktopApi.removeAllListeners('bluetooth/select-device-event');
            desktopApi.removeAllListeners('bluetooth/connect-device-event');
        };
    }, []);

    const onSelect = (deviceId?: string) => {
        desktopApi.bluetoothSelectDevice(deviceId);
    };

    const close = () => {
        onSelect();
        onCancel();
    };

    const isLoading = connectingStatus && connectingStatus.status !== 'error';

    return (
        <SmallModal heading={<div>Select bluetooth device</div>} isCancelable onCancel={close}>
            {!isBluetoothEnabled && <div>Bluetooth not enabled</div>}
            {isBluetoothEnabled && deviceList.length > 0 && (
                <DeviceList>
                    {deviceList.map(d => (
                        <DeviceListItem
                            key={d.uuid}
                            onClick={() => onSelect(d.uuid)}
                            isLoading={isLoading}
                        >
                            {`${d.name} (${d.uuid})`}
                        </DeviceListItem>
                    ))}
                </DeviceList>
            )}
            {isBluetoothEnabled && deviceList.length === 0 && (
                <Loader>
                    <StyledSpinner size={24} />
                    Looking for devices...
                </Loader>
            )}
            {connectingStatus && <div>Connection status: {connectingStatus.status}</div>}
            {connectingStatus?.status === 'pairing' && (
                <div>
                    <p>Paring Trezor with your operating system.</p>
                    <p>Confirm connection on you device then compare and confirm PIN.</p>
                </div>
            )}
        </SmallModal>
    );
};
