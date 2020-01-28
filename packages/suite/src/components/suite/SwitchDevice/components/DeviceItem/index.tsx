import React from 'react';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import styled from 'styled-components';
import { Button, colors, variables } from '@trezor/components-v2';
import { Translation } from '@suite-components';
import Card from '@suite-components/Card';
import * as deviceUtils from '@suite-utils/device';
import messages from '@suite/support/messages';
import WalletInstance from '../WalletInstance/Container';
import { Props } from './Container';

const DeviceWrapper = styled.div`
    display: flex;
    flex-direction: column;
    border-radius: 6px;
    background-color: ${colors.BLACK96};
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
`;

const DeviceTitle = styled.span`
    font-size: ${variables.FONT_SIZE.NORMAL};
`;

const DeviceStatus = styled.span<{ color: string }>`
    font-size: ${variables.FONT_SIZE.BODY};
    font-weight: 600;
    color: ${props => props.color};
`;

const Col = styled.div<{ grow?: number }>`
    display: flex;
    flex-grow: ${props => props.grow || 0};
    align-items: flex-start;
    flex-direction: column;
`;

const ChooseDevice = styled(Button)`
    font-size: ${variables.FONT_SIZE.BUTTON};
`;

const WalletsWrapper = styled.div<{ enabled: boolean }>`
    padding: 0px 24px;
    opacity: ${props => (props.enabled ? 1 : 0.5)};
    pointer-events: ${props => (props.enabled ? 'unset' : 'none')};
    padding-bottom: ${props => (props.enabled ? '0px' : '24px')};
`;

const WalletsTooltips = styled.div`
    padding: 10px 24px;
    flex-direction: column;
    justify-content: flex-end;
`;

const InstancesWrapper = styled(Card)`
    display: block;
    background-color: ${colors.WHITE};
`;

const AddWallet = styled.div`
    display: flex;
    padding: 10px 24px;
    justify-content: flex-end;
`;

const UnknownDevice = (props: Props & WrappedComponentProps) => {
    const { device } = props;
    const deviceStatus = deviceUtils.getStatus(device);
    return (
        <DeviceWrapper>
            <Device>
                <Col>
                    <DeviceTitle>{device.label}</DeviceTitle>
                    <DeviceStatus color={deviceUtils.getStatusColor(deviceStatus)}>
                        {deviceUtils.getStatusName(deviceStatus, props.intl)}
                    </DeviceStatus>
                </Col>
                {device.type === 'unacquired' && (
                    <Button
                        variant="tertiary"
                        icon="PLUS"
                        onClick={() => props.acquireDevice(device)}
                    >
                        Acquire!
                    </Button>
                )}
            </Device>
        </DeviceWrapper>
    );
};

const DeviceItem = (props: Props & WrappedComponentProps) => {
    const { device, selectedDevice, backgroundRoute } = props;
    if (device.type !== 'acquired') return <UnknownDevice {...props} />;

    const deviceStatus = deviceUtils.getStatus(device);
    const isWalletContext =
        !!backgroundRoute &&
        (backgroundRoute.app === 'wallet' || backgroundRoute.app === 'dashboard');
    const hasDeviceSelection =
        !isWalletContext && !deviceUtils.isSelectedDevice(selectedDevice, device);

    const selectDeviceInstance = async (instance: Props['device']) => {
        await props.selectDevice(instance);
        props.closeModalApp();
    };

    const addDeviceInstance = async (instance: Props['device']) => {
        await props.createDeviceInstance(instance);
        props.closeModalApp();
    };

    return (
        <DeviceWrapper key={device.path}>
            <Device>
                <Col grow={1}>
                    <DeviceTitle>{device.label}</DeviceTitle>
                    <DeviceStatus color={deviceUtils.getStatusColor(deviceStatus)}>
                        {deviceUtils.getStatusName(deviceStatus, props.intl)}
                    </DeviceStatus>
                </Col>
                {hasDeviceSelection && (
                    <Col>
                        <ChooseDevice
                            size="small"
                            variant="secondary"
                            onClick={() => selectDeviceInstance(device)}
                        >
                            Choose device
                        </ChooseDevice>
                    </Col>
                )}
            </Device>
            <WalletsWrapper enabled={isWalletContext}>
                {isWalletContext && (
                    <WalletsTooltips>
                        <Col>Remember wallet (i)</Col>
                        <Col>Hide wallet (i)</Col>
                    </WalletsTooltips>
                )}
                <InstancesWrapper>
                    {props.instances.map(instance => (
                        <WalletInstance
                            key={`${instance.label}-${instance.instance}-${instance.state}`}
                            instance={instance}
                            enabled={isWalletContext}
                            selected={deviceUtils.isSelectedInstance(selectedDevice, instance)}
                            selectDeviceInstance={selectDeviceInstance}
                        />
                    ))}
                </InstancesWrapper>
                {isWalletContext && (
                    <AddWallet>
                        <Button
                            variant="tertiary"
                            icon="PLUS"
                            disabled={!device.connected} // TODO: tooltip?
                            onClick={async () => addDeviceInstance(device)}
                        >
                            <Translation {...messages.TR_ADD_HIDDEN_WALLET} />
                        </Button>
                    </AddWallet>
                )}
            </WalletsWrapper>
        </DeviceWrapper>
    );
};

export default injectIntl(DeviceItem);
