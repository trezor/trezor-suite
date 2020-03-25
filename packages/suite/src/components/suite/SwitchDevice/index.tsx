import React from 'react';
import styled from 'styled-components';
import { colors, H2, Button } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import ModalWrapper from '@suite-components/ModalWrapper';
import * as deviceUtils from '@suite-utils/device';
import { isWebUSB } from '@suite-utils/transport';
import DeviceItem from './components/DeviceItem/Container';

import { Props } from './Container';
import WebusbButton from '../WebusbButton';

const Wrapper = styled(ModalWrapper)`
    flex-direction: column;
    text-align: center;
    width: 100%;
    max-width: 720px;
`;

const Description = styled.div`
    line-height: 1.43;
    width: 90%;
    margin-bottom: 10px;
    color: ${colors.BLACK50};
`;

const CheckForDevicesWrapper = styled.div`
    display: flex;
    margin-bottom: 30px;
`;

const In = styled.div`
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
    min-width: 400px;
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
        <Wrapper>
            <In>
                <H2>
                    <Translation id="TR_CHOOSE_WALLET" />
                </H2>
                <Description tabIndex={0}>
                    <Translation id="TR_THIS_IS_PLACE_TO_SEE_ALL" />
                </Description>
                {showWebUsb && (
                    <CheckForDevicesWrapper>
                        <WebusbButton ready>
                            <Button icon="PLUS" variant="tertiary">
                                <Translation id="TR_CHECK_FOR_DEVICES" />
                            </Button>
                        </WebusbButton>
                    </CheckForDevicesWrapper>
                )}
                {sortedDevices.map(device => (
                    <DeviceItem
                        key={device.path}
                        device={device}
                        instances={deviceUtils.getDeviceInstances(device, devices)}
                        backgroundRoute={backgroundRoute}
                        closeModalApp={props.closeModalApp}
                    />
                ))}
            </In>
        </Wrapper>
    );
};

export default SwitchDeviceModal;
