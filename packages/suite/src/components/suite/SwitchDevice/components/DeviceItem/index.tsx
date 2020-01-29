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
import ColHeader from './components/ColHeader';
import DeviceImage from '@suite-components/images/DeviceImage';

const DeviceWrapper = styled.div`
    display: flex;
    flex-direction: column;
    border-radius: 6px;
    background-color: ${colors.BLACK96};
    width: 100%;
    padding: 24px 30px;

    & + & {
        margin-top: 20px;
    }
`;

const Device = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 8px;
`;

const DeviceTitle = styled.span`
    font-size: ${variables.FONT_SIZE.NORMAL};
    margin-bottom: 6px;
`;

const DeviceStatus = styled.span<{ color: string }>`
    font-size: ${variables.FONT_SIZE.TINY};
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
    opacity: ${props => (props.enabled ? 1 : 0.5)};
    pointer-events: ${props => (props.enabled ? 'unset' : 'none')};
    padding-bottom: ${props => (props.enabled ? '0px' : '24px')};
`;

const WalletsTooltips = styled.div`
    /* padding: 10px 24px; */
    /* flex-direction: column; */
    display: flex;
    justify-content: flex-end;
    padding-bottom: 12px;
`;

const InstancesWrapper = styled(Card)`
    flex-direction: column;
    border-radius: 3px;
    background-color: #f5f5f5;
    margin-bottom: 20px;
    box-shadow: 0px 3px 20px 6px #e6e6e6;
`;

const StyledWalletInstance = styled(WalletInstance)`
    & + & {
        border-top: 2px solid ${colors.BLACK96};
    }
`;

const AddWallet = styled.div`
    display: flex;
    justify-content: flex-end;
`;

const DeviceHeader = styled.div`
    display: flex;
    align-items: center;
    flex: 1;
`;

const DeviceImageWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
`;

// TODO: this is going to be a problem with different col headers length since they won't be aligned with the columns inside WalletInstance
const RememberWallet = styled(ColHeader)``;
const HideWallet = styled(ColHeader)`
    margin-left: 32px;
    margin-right: 16px;
`;

const UnknownDevice = (props: Props & WrappedComponentProps) => {
    const { device } = props;
    const deviceStatus = deviceUtils.getStatus(device);
    return (
        <DeviceWrapper>
            <Device>
                <DeviceHeader>
                    <DeviceImageWrapper>
                        <DeviceImage device={device} />
                    </DeviceImageWrapper>
                    <Col>
                        <DeviceTitle>{device.label}</DeviceTitle>
                        <DeviceStatus color={deviceUtils.getStatusColor(deviceStatus)}>
                            {deviceUtils.getStatusName(deviceStatus, props.intl)}
                        </DeviceStatus>
                    </Col>
                </DeviceHeader>
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
    const hasAtLeastOneWallet = props.instances.find(d => d.state);

    const selectDeviceInstance = async (instance: Props['device']) => {
        await props.selectDevice(instance);
        props.closeModalApp();
    };

    const addDeviceInstance = async (instance: Props['device']) => {
        await props.createDeviceInstance(instance);
        props.closeModalApp();
    };

    return (
        <DeviceWrapper>
            <Device>
                <DeviceHeader>
                    <DeviceImageWrapper>
                        <DeviceImage device={device} />
                    </DeviceImageWrapper>
                    <Col grow={1}>
                        <DeviceTitle>{device.label}</DeviceTitle>
                        <DeviceStatus color={deviceUtils.getStatusColor(deviceStatus)}>
                            {deviceUtils.getStatusName(deviceStatus, props.intl)}
                        </DeviceStatus>
                    </Col>

                    {hasDeviceSelection && (
                        <ChooseDevice
                            size="small"
                            variant="secondary"
                            onClick={() => selectDeviceInstance(device)}
                        >
                            Choose device
                        </ChooseDevice>
                    )}
                </DeviceHeader>
            </Device>
            <WalletsWrapper enabled={isWalletContext}>
                {isWalletContext && (
                    <WalletsTooltips>
                        <RememberWallet
                            tooltipContent="Remember allows you to access any wallet
in watch-only mode without connected device."
                        >
                            Remember wallet
                        </RememberWallet>
                        <HideWallet tooltipContent="blabla">Hide wallet</HideWallet>
                    </WalletsTooltips>
                )}
                <InstancesWrapper>
                    {props.instances.map(instance => (
                        <StyledWalletInstance
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
                            disabled={!device.connected || !hasAtLeastOneWallet} // TODO: tooltip?
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
