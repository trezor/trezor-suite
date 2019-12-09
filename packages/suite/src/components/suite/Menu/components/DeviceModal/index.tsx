import React from 'react';
import styled from 'styled-components';
import { Modal } from '@trezor/components';
import { Button, colors, variables } from '@trezor/components-v2';
import * as deviceUtils from '@suite-utils/device';
import { Props } from './Container';
import DeviceItem from './components/DeviceItem';
import { TrezorDevice, AcquiredDevice } from '@suite-types';
import { Translation } from '@suite/components/suite/Translation';
import messages from '@suite/support/messages';

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
        // TODO: if we really want to auto-enable passphrase feature,
        // we need to wait for the device to trigger 'confirm on device' modal,
        // then for the user to confirm it and only then we can fire up adding a new hidden wallet
        // if (instance.features && !instance.features.passphrase_protection) {
        //     // eslint-disable-next-line @typescript-eslint/camelcase
        //     props.applySettings({ use_passphrase: true });
        // }
        props.onCreateDeviceInstance(instance as AcquiredDevice);
    };

    return (
        <StyledModal>
            <Wrapper>
                <In>
                    <Title>
                        <Translation {...messages.TR_SWITCH_DEVICE} />
                    </Title>
                    <Description>
                        <Translation {...messages.TR_THIS_IS_PLACE_TO_SEE_ALL} />
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
                            <Translation {...messages.TR_CLOSE} />
                        </Button>
                    </ModalActions>
                </In>
            </Wrapper>
        </StyledModal>
    );
};

export default SwitchDeviceModal;
