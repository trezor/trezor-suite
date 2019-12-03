import React from 'react';
import styled, { css } from 'styled-components';
import { Modal } from '@trezor/components';
import { Icon, Button, colors } from '@trezor/components-v2';
import * as deviceUtils from '@suite-utils/device';
import * as accountUtils from '@wallet-utils/accountUtils';
import { Props } from './Container';
import { AcquiredDevice, TrezorDevice } from '@suite/types/suite';

// TODO:
// Undiscovered wallet, connect to discover https://app.zeplin.io/project/5dadb7820bdfd3832e04afca/screen/5dde6fd821730311f40ad3a0
// Title for wallet instances (coinds, usd value,...)
// Device ordering
// refactor to multiple components
// remove forget modal, move forgetDevice from modalActions

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
    font-size: 14px;
    line-height: 1.43;
    margin-bottom: 20px;
    color: #7e7e7e;
`;

const In = styled.div`
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
    min-width: 400px;
`;

const DeviceBox = styled.div`
    display: flex;
    flex-direction: column;
    border-radius: 6px;
    border: solid 2px #ebebeb;
    background-color: #ffffff;
    width: 100%;

    & + & {
        margin-top: 10px;
    }
`;

const Device = styled.div`
    display: flex;
    padding: 24px;
    flex-direction: row;
    align-items: center;
    border-bottom: 2px solid #f5f5f5;
`;

const DeviceTitle = styled.span`
    font-size: 16px;
`;
const DeviceStatus = styled.span<{ color: string }>`
    font-size: 14px;
    font-weight: 600;
    color: ${props => props.color};
`;

const Badge = styled.div`
    font-size: 12px;
    font-weight: 600;
    padding: 1px 2px;
    border-radius: 2px;
    background-color: #b3b3b3;
    text-transform: uppercase;
    color: white;
    align-self: center;
`;

const Col = styled.div<{ grow?: number }>`
    display: flex;
    flex-grow: ${props => props.grow || 0};
    align-items: flex-start;
    flex-direction: column;
`;

const WalletInstance = styled.div<{ active: boolean }>`
    display: flex;
    padding: 10px 24px;
    align-items: center;
    flex-direction: row;
    cursor: pointer;

    &:hover {
        background: #f5f5f5;
    }

    ${props =>
        props.active &&
        css`
            background: #f5f5f5;
        `}
`;

const InstanceTitle = styled.div`
    color: #808080;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
`;
const InstanceType = styled.div`
    color: #808080;
    font-size: 12px;
    /* text-transform: uppercase; */
`;

const Actions = styled.div`
    display: flex;
    padding: 24px;
    justify-content: center;
`;

const SortIconWrapper = styled.div`
    margin-right: 12px;
`;

const ModalActions = styled.div`
    margin-top: 20px;
`;

const ForgetButton = styled(Button)`
    font-size: 14px;
`;

const SwitchDeviceModal = (props: Props) => {
    if (!props.isOpen) return null;
    const { devices, selectedDevice } = props;
    const otherDevices = deviceUtils.getOtherDevices(selectedDevice, devices);

    const getAccountsNumber = (device: TrezorDevice) =>
        accountUtils.getDeviceAccounts(device, props.accounts).length;

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
                    {[selectedDevice, ...otherDevices].map(device => {
                        if (!device) return null;
                        const deviceStatus = deviceUtils.getStatus(device);
                        const deviceInstances = deviceUtils.getDeviceInstances(
                            device,
                            devices,
                            true,
                        );
                        console.log('device', device.label);
                        console.log('instances', deviceInstances);
                        return (
                            <DeviceBox key={device.path}>
                                <Device>
                                    <Col>
                                        <DeviceTitle>{device.label}</DeviceTitle>
                                        <DeviceStatus
                                            color={deviceUtils.getStatusColor(deviceStatus)}
                                        >
                                            {deviceUtils.getStatusName(deviceStatus, props.intl)}
                                        </DeviceStatus>
                                    </Col>
                                    <Col grow={1}>
                                        {!deviceUtils.isDeviceRemembered(device) && (
                                            <Badge>Guest Mode</Badge>
                                        )}
                                    </Col>
                                    <Col>
                                        <ForgetButton
                                            size="small"
                                            variant="secondary"
                                            inlineWidth
                                            onClick={() => {
                                                props.forgetDevice(device);
                                            }}
                                        >
                                            Forget device
                                        </ForgetButton>
                                    </Col>
                                </Device>

                                {deviceInstances.map(instance => (
                                    <WalletInstance
                                        key={`${instance.label}${instance.instance}${instance.state}`}
                                        active={selectedDevice.state === instance.state}
                                        onClick={() => {
                                            onSelectInstance(instance);
                                        }}
                                    >
                                        <SortIconWrapper>
                                            <Icon size={12} icon="SORT" />
                                        </SortIconWrapper>
                                        <Col grow={1}>
                                            <InstanceTitle>
                                                {getAccountsNumber(instance)} Accounts - X COINS - Y
                                                USD
                                            </InstanceTitle>
                                            <InstanceType>
                                                {instance.useEmptyPassphrase
                                                    ? 'No passphrapse'
                                                    : 'Passphrase'}
                                            </InstanceType>
                                        </Col>
                                        <Col>
                                            {!instance.useEmptyPassphrase && (
                                                <ForgetButton
                                                    size="small"
                                                    variant="secondary"
                                                    inlineWidth
                                                    onClick={() => {
                                                        props.forgetDeviceInstance(instance);
                                                    }}
                                                >
                                                    Forget instance
                                                </ForgetButton>
                                            )}
                                        </Col>
                                    </WalletInstance>
                                ))}
                                <Actions>
                                    <Button
                                        inlineWidth
                                        variant="tertiary"
                                        icon="PLUS"
                                        onClick={() => {
                                            onAddHiddenWallet(device);
                                            console.log(device.label);
                                            console.log(device);
                                        }}
                                    >
                                        Add hidden wallet
                                    </Button>
                                </Actions>
                            </DeviceBox>
                        );
                    })}
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
