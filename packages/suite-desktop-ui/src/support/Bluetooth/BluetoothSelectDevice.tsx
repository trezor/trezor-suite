import { useEffect, useState } from 'react';

import styled from 'styled-components';

import { Modal, Backdrop, Button } from '@trezor/components';
import { desktopApi } from '@trezor/suite-desktop-api';

interface ElectronBluetoothDevice {
    deviceId: string;
    deviceName: string;
}

const Wrapper = styled.div`
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
`;

const StyledModal = styled(Modal)`
    // max-width: 600px;
`;
const StyledButton = styled(Button)`
    margin: 21px 0;
`;

export const BluetoothSelectDevice = () => {
    const [enabled, setEnabled] = useState(false);
    const [deviceList, setDeviceList] = useState<ElectronBluetoothDevice[]>([]);

    useEffect(() => {
        desktopApi.on('bluetooth/select-device-request', list => {
            setEnabled(true);
            setDeviceList(list);
        });

        return () => {
            desktopApi.removeAllListeners('bluetooth/select-device-request');
        };
    }, []);

    const onClick = async () => {
        setEnabled(true);
        try {
            const device = await navigator.bluetooth.requestDevice({
                filters: [{ services: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e'] }],
                // acceptAllDevices: true,
            });
            // device.onadvertisementreceived = adv => {
            //     console.warn('onAdv received', adv);
            // };
            // device.onserviceadded = serv => {
            //     console.warn('onserviceadded', serv);
            // };
            // device.oncharacteristicvaluechanged = evt => {
            //     console.warn('DEVICE-oncharacteristicvaluechanged', evt);
            // };
            device.ongattserverdisconnected = evt => {
                console.warn('DEVICE-ongattserverdisconnected', evt);
            };
            device.watchAdvertisements();

            console.warn('DEVICE', device);
            const connection = await device.gatt?.connect();

            console.warn('DEVICE-connection', connection);
            const [service] = await device.gatt!.getPrimaryServices();
            console.warn('DEVICE-service', service);
            const [write, read] = await service?.getCharacteristics();
            console.warn('DEVICE-charakter', service, write, read);
            // read.startNotifications();
            // read.oncharacteristicvaluechanged = evt => {
            //     console.warn('READ-oncharacteristicvaluechanged', evt);
            // };
        } catch (error) {
            // silent
            console.warn('navigator.bluetooth.requestDevice', error);
        }

        setEnabled(false);
    };

    const onSelect = (deviceId: string) => {
        desktopApi.bluetoothSelectDeviceResponse(deviceId);
        setEnabled(false);
    };

    return (
        <>
            {false && (
                <Button onClick={onClick} isDisabled={enabled}>
                    Find device
                </Button>
            )}
            {enabled && (
                <Backdrop>
                    <StyledModal
                        currentProgressBarStep={0}
                        totalProgressBarSteps={100}
                        headerComponent={
                            <StyledButton
                                variant="secondary"
                                icon="CROSS"
                                alignIcon="right"
                                onClick={() => onSelect('')}
                            >
                                CLOSE
                            </StyledButton>
                        }
                        isCancelable
                        onCancel={() => onSelect('')}
                    >
                        {deviceList.map(d => (
                            <Button key={d.deviceId} onClick={() => onSelect(d.deviceId)}>
                                {`${d.deviceName} (${d.deviceId})`}
                            </Button>
                        ))}
                    </StyledModal>
                </Backdrop>
            )}
        </>
    );
};
