import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';
import { Modal } from '@suite-components';
import * as deviceUtils from '@suite-utils/device';
import { isWebUsb } from '@suite-utils/transport';
import { getBackgroundRoute } from '@suite-utils/router';
import DeviceItem from './components/DeviceItem';
import { ForegroundAppProps } from '@suite-types';
import { useSelector } from '@suite-hooks';

import { WebUsbButton } from '../WebUsbButton';

const DeviceItemsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
`;

export const SwitchDevice = ({ cancelable, onCancel }: ForegroundAppProps) => {
    const { selectedDevice, devices, transport } = useSelector(state => ({
        router: state.router,
        selectedDevice: state.suite.device,
        devices: state.devices,
        transport: state.suite.transport,
    }));

    const isWebUsbTransport = isWebUsb(transport);

    // exclude selectedDevice from list, because other devices could have a higher priority
    // and we want to have selectedDevice on top
    const sortedDevices = deviceUtils
        .getFirstDeviceInstance(devices)
        .filter(d => !deviceUtils.isSelectedDevice(selectedDevice, d));

    // append selectedDevice at top of the list
    if (selectedDevice) {
        sortedDevices.unshift(selectedDevice);
    }

    const backgroundRoute = getBackgroundRoute();

    return (
        <Modal
            isCancelable={cancelable}
            onCancel={onCancel}
            heading={<Translation id="TR_CHOOSE_WALLET" />}
            headerComponents={
                isWebUsbTransport
                    ? [<WebUsbButton variant="tertiary" key="webusb-button" />]
                    : undefined
            }
        >
            <DeviceItemsWrapper>
                {sortedDevices.map(device => (
                    <DeviceItem
                        key={`${device.id}-${device.instance}`}
                        device={device}
                        instances={deviceUtils.getDeviceInstances(device, devices)}
                        backgroundRoute={backgroundRoute}
                        onCancel={onCancel}
                    />
                ))}
            </DeviceItemsWrapper>
        </Modal>
    );
};
