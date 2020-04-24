import React from 'react';
import styled from 'styled-components';
import { Button, Modal } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
// import ModalWrapper from '@suite-components/ModalWrapper';
import * as deviceUtils from '@suite-utils/device';
import { isWebUSB } from '@suite-utils/transport';
import DeviceItem from './components/DeviceItem/Container';

import { Props } from './Container';
import WebusbButton from '../WebusbButton';

const StyledModal = styled(Modal)`
    flex-direction: column;
    text-align: center;
`;

const CheckForDevicesWrapper = styled.div`
    display: flex;
    justify-content: center;
    margin-top: 10px;
`;

const DeviceItemsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
`;

const SwitchDeviceModal = (props: Props) => {
    const { devices, selectedDevice, modal } = props;
    const showWebUsb = isWebUSB(props.transport);
    // return action modal, it could be requested by Trezor while enabling passphrase encryption
    if (modal) return modal;
    // exclude selectedDevice from list, because other devices could have a higher priority
    // and we want to have selectedDevice on top
    const sortedDevices = deviceUtils
        .getFirstDeviceInstance(devices)
        .filter(d => !deviceUtils.isSelectedDevice(selectedDevice, d));

    // append selectedDevice at top of the list
    if (selectedDevice) {
        sortedDevices.unshift(selectedDevice);
    }

    const backgroundRoute = props.getBackgroundRoute();

    return (
        <StyledModal
            heading={<Translation id="TR_CHOOSE_WALLET" />}
            cancelable={props.cancelable}
            onCancel={props.onCancel}
            description={
                <>
                    <Translation id="TR_THIS_IS_PLACE_TO_SEE_ALL" />
                    {showWebUsb && (
                        <CheckForDevicesWrapper>
                            <WebusbButton ready>
                                <Button icon="SEARCH" variant="tertiary">
                                    <Translation id="TR_CHECK_FOR_DEVICES" />
                                </Button>
                            </WebusbButton>
                        </CheckForDevicesWrapper>
                    )}
                </>
            }
        >
            <DeviceItemsWrapper>
                {sortedDevices.map(device => (
                    <DeviceItem
                        key={device.path}
                        device={device}
                        instances={deviceUtils.getDeviceInstances(device, devices)}
                        backgroundRoute={backgroundRoute}
                        closeModalApp={props.closeModalApp}
                    />
                ))}
            </DeviceItemsWrapper>
        </StyledModal>
    );
};

export default SwitchDeviceModal;
