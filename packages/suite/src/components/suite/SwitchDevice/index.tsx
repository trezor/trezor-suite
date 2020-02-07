import React from 'react';
import styled from 'styled-components';
import { colors, variables, H2 } from '@trezor/components-v2';
import { Translation } from '@suite-components/Translation';
import ModalWrapper from '@suite-components/ModalWrapper';
import * as deviceUtils from '@suite-utils/device';
import DeviceItem from './components/DeviceItem/Container';
import messages from '@suite/support/messages';
import { Props } from './Container';

const Wrapper = styled(ModalWrapper)`
    flex-direction: column;
    text-align: center;
    width: 100%;
    max-width: 720px;
`;

const Description = styled.div`
    font-size: ${variables.FONT_SIZE.BODY};
    line-height: 1.43;
    width: 90%;
    margin-bottom: 20px;
    color: ${colors.BLACK50};
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
                    <Translation {...messages.TR_SWITCH_DEVICE} />
                </H2>
                <Description>
                    <Translation {...messages.TR_THIS_IS_PLACE_TO_SEE_ALL} />
                </Description>
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
