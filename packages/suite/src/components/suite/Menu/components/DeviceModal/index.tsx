import React from 'react';
import styled from 'styled-components';
import { Modal } from '@trezor/components';
import { Button, colors, variables } from '@trezor/components-v2';
import * as deviceUtils from '@suite-utils/device';
import { Props } from './Container';
import DeviceItem from './components/DeviceItem';
import { TrezorDevice } from '@suite-types';

// TODO:
// Undiscovered wallet, connect to discover https://app.zeplin.io/project/5dadb7820bdfd3832e04afca/screen/5dde6fd821730311f40ad3a0
// Title for wallet instances (usd value,...)

const StyledModal = styled(Modal)`
    box-shadow: 0 10px 60px 0 #4d4d4d;
`;

const Wrapper = styled.div`
    position: relative;
    padding: 30px 24px;
    display: flex;
    flex-direction: column;
    text-align: center;
    width: 100%;
    max-width: 600px;
`;

const Title = styled.div`
    font-size: 15pt;
`;

const Description = styled.div`
    font-size: ${variables.FONT_SIZE.BODY};
    line-height: 1.43;
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

const ModalActions = styled.div`
    margin-top: 20px;
`;

const SwitchDeviceModal = (props: Props) => {
    if (!props.isOpen) return null;
    const { devices, selectedDevice } = props;
    const sortedDevices = deviceUtils.getPhysDevices(devices);

    const onSelectInstance = (instance: TrezorDevice) => {
        props.closeModal();
        props.selectDevice(instance);
    };

    const onAddHiddenWallet = (instance: TrezorDevice) => {
        props.closeModal();
        props.requestDeviceInstance(instance);
    };

    return (
        <StyledModal>
            <Wrapper>
                <In>
                    <Title>Switch Device</Title>
                    <Description>
                        This is a place to see all your devices. You can further set them up in
                        Settings but here you can switch between devices and see their statuses.
                    </Description>
                    {sortedDevices.map(device => (
                        <DeviceItem
                            key={device.path}
                            device={device}
                            selectedDevice={selectedDevice}
                            instances={deviceUtils.getDeviceInstances(device, devices, true)}
                            addHiddenWallet={onAddHiddenWallet}
                            selectInstance={onSelectInstance}
                            forgetDevice={props.forgetDevice}
                            accounts={props.accounts}
                        />
                    ))}
                    <ModalActions>
                        <Button variant="secondary" onClick={() => props.closeModal()}>
                            Close
                        </Button>
                    </ModalActions>
                </In>
            </Wrapper>
        </StyledModal>
    );
};

export default SwitchDeviceModal;
