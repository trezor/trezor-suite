import styled from 'styled-components';

import * as deviceUtils from '@suite-common/suite-utils';

import { Translation } from 'src/components/suite/Translation';
import { Modal } from 'src/components/suite';
import { isWebUsb } from 'src/utils/suite/transport';
import { getBackgroundRoute } from 'src/utils/suite/router';
import { ForegroundAppProps } from 'src/types/suite';
import { useSelector } from 'src/hooks/suite';
import { selectDevice, selectDevices } from 'src/reducers/suite/deviceReducer';

import DeviceItem from './components/DeviceItem';
import { WebUsbButton } from '../WebUsbButton';

const DeviceItemsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
`;

export const SwitchDevice = ({ cancelable, onCancel }: ForegroundAppProps) => {
    const selectedDevice = useSelector(selectDevice);
    const devices = useSelector(selectDevices);
    const transport = useSelector(state => state.suite.transport);

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
