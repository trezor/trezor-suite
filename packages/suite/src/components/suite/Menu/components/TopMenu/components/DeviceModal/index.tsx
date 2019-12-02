import React from 'react';
import styled, { css } from 'styled-components';
import { Modal } from '@trezor/components';
import { Icon, Button, colors } from '@trezor/components-v2';
import * as deviceUtils from '@suite-utils/device';
import { Props } from './Container';
import { AcquiredDevice } from '@suite/types/suite';

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
`;

const Device = styled.div`
    display: flex;
    padding: 24px;
    flex-direction: row;
    align-items: center;
    border-bottom: 2px solid #f5f5f5;
    & + & {
        margin-top: 10px;
    }
`;

const DeviceTitle = styled.span`
    font-size: 16px;
`;
const DeviceStatus = styled.span<{ connected: boolean }>`
    font-size: 14px;
    font-weight: 600;
    color: ${props => (props.connected ? '#259f2a' : '#494949')};
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
    text-transform: uppercase;
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
    const selectedInstances = deviceUtils.getDeviceInstances(selectedDevice, devices)
    const otherDevices = deviceUtils.getOtherDevices(selectedDevice, devices);

    const otherInstances: AcquiredDevice[][] = [];
    otherDevices.forEach(d => otherInstances.push(deviceUtils.getDeviceInstances(d, devices)));

    return (
        <StyledModal>
            <Wrapper>
                <In>
                    <Title>Switch Device</Title>
                    <Description>
                        This is a place to see all your devices. You can further set them up in
                        Settings but here you can switch between devices and see their statuses.
                    </Description>
                    {props.devices.map}
                    <DeviceBox>
                        <Device>
                            <Col>
                                <DeviceTitle>My trezor</DeviceTitle>
                                <DeviceStatus connected>Connected</DeviceStatus>
                            </Col>
                            <Col grow={1}>
                                <Badge>Guest Mode</Badge>
                            </Col>
                            <Col>
                                <ForgetButton size="small" variant="secondary" inlineWidth>
                                    Forget device
                                </ForgetButton>
                            </Col>
                        </Device>
                        <WalletInstance active>
                            <SortIconWrapper>
                                <Icon size={12} icon="SORT" />
                            </SortIconWrapper>
                            <Col grow={1}>
                                <InstanceTitle>2 Accounts - 2 COINS - 4000 USD</InstanceTitle>
                                <InstanceType>No Passphrase</InstanceType>
                            </Col>
                            <Col>
                                <ForgetButton size="small" variant="secondary" inlineWidth>
                                    Forget device
                                </ForgetButton>
                            </Col>
                        </WalletInstance>
                        <Actions>
                            <Button inlineWidth variant="tertiary" icon="PLUS">
                                Add hidden wallet
                            </Button>
                        </Actions>
                    </DeviceBox>
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
