import React from 'react';
import styled from 'styled-components';
import { Button, H1, Icon, Modal, colors } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import * as deviceUtils from '@suite-utils/device';
import { isWebUSB } from '@suite-utils/transport';
import DeviceItem from './components/DeviceItem/Container';

import { Props } from './Container';
import WebusbButton from '../WebusbButton';

const StyledModal = styled(Modal)`
    flex-direction: column;
    text-align: center;
`;

const Heading = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px 32px;
    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};
`;

const HeadingActions = styled.div`
    display: flex;
    align-items: center;
`;

const CancelIconWrapper = styled.div`
    display: flex;
    align-items: center;
    margin-left: 30px;
    cursor: pointer;
`;

const CheckForDevicesWrapper = styled.div`
    display: flex;
    justify-content: center;
`;

const DeviceItemsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    padding: 24px 32px;
`;

const SwitchDeviceModal = (props: Props) => {
    const { devices, selectedDevice, modal } = props;
    const showWebUsb = isWebUSB(props.transport);
    // return action modal, it could be requested by Trezor while enabling passphrase encryption
    if (modal)
        return (
            // Wrap modal in Modal component because modal passed to ApplicationModal has no background (overlay)
            <Modal useFixedWidth={false} padding={['0px', '0px', '0px', '0px']}>
                {modal}
            </Modal>
        );
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
            padding={['0px', '0px', '0px', '0px']}
            hideCancelButton
            heading={
                <Heading>
                    <H1 noMargin>
                        <Translation id="TR_CHOOSE_WALLET" />
                    </H1>
                    <HeadingActions>
                        {showWebUsb && (
                            <CheckForDevicesWrapper>
                                <WebusbButton ready>
                                    <Button icon="SEARCH" variant="tertiary">
                                        <Translation id="TR_CHECK_FOR_DEVICES" />
                                    </Button>
                                </WebusbButton>
                            </CheckForDevicesWrapper>
                        )}
                        <CancelIconWrapper onClick={props.onCancel}>
                            <Icon size={24} color={colors.NEUE_TYPE_DARK_GREY} icon="CROSS" />
                        </CancelIconWrapper>
                    </HeadingActions>
                </Heading>
            }
            cancelable={props.cancelable}
            onCancel={props.onCancel}
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
