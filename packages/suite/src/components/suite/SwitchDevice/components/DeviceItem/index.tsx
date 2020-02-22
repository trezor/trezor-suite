import React from 'react';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import styled from 'styled-components';
import { Button, colors, variables, Icon } from '@trezor/components';
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

const Row = styled.div<{ grow?: number }>`
    display: flex;
    flex-grow: ${props => props.grow || 0};
    align-items: center;
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

const Attention = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: 600;
    color: ${colors.RED_ERROR};
    margin-right: 20px;
`;

const AttentionIconWrapper = styled.div`
    margin-right: 1ch;
`;

// TODO: this is going to be a problem with different col headers length since they won't be aligned with the columns inside WalletInstance
const RememberWallet = styled(ColHeader)``;
const HideWallet = styled(ColHeader)`
    margin-left: 32px;
    margin-right: 16px;
`;

const DeviceItem = (props: Props & WrappedComponentProps) => {
    const { device, selectedDevice, backgroundRoute } = props;
    const deviceStatus = deviceUtils.getStatus(device);
    const isUnknown = device.type !== 'acquired';
    const needsAttention = deviceUtils.deviceNeedsAttention(deviceStatus);
    const needsAcquire =
        device.type === 'unacquired' ||
        deviceStatus === 'used-in-other-window' ||
        deviceStatus === 'was-used-in-other-window';

    const isWalletContext =
        !!backgroundRoute &&
        (backgroundRoute.app === 'wallet' || backgroundRoute.app === 'dashboard');
    const hasDeviceSelection =
        !isWalletContext && !deviceUtils.isSelectedDevice(selectedDevice, device);
    const hasAtLeastOneWallet = props.instances.find(d => d.state);

    const selectDeviceInstance = async (instance: Props['device']) => {
        await props.selectDevice(instance);
        props.closeModalApp(!isWalletContext);
    };

    const addDeviceInstance = async (instance: Props['device']) => {
        await props.createDeviceInstance(instance);
        props.closeModalApp(!isWalletContext);
    };

    const onSolveIssueClick = () => {
        if (needsAcquire) {
            props.acquireDevice(device);
        } else {
            selectDeviceInstance(device);
        }
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
                        <DeviceStatus color={device.connected ? colors.GREEN : colors.BLACK50}>
                            {device.connected ? (
                                <Translation {...messages.TR_CONNECTED} />
                            ) : (
                                <Translation {...messages.TR_DISCONNECTED} />
                            )}
                        </DeviceStatus>
                    </Col>

                    {needsAttention && (
                        <Row>
                            <Attention>
                                <AttentionIconWrapper>
                                    {/* TODO: warning icon */}
                                    <Icon icon="INFO" size={14} color={colors.RED_ERROR} />
                                </AttentionIconWrapper>
                                <Translation {...messages.TR_DEVICE_NEEDS_ATTENTION} />
                            </Attention>
                            <Button
                                variant="secondary"
                                size="small"
                                // icon="REFRESH"
                                onClick={() => onSolveIssueClick()}
                            >
                                <Translation {...messages.TR_SOLVE_ISSUE} />
                            </Button>
                        </Row>
                    )}

                    {!isUnknown && hasDeviceSelection && (
                        <ChooseDevice
                            size="small"
                            variant="secondary"
                            onClick={() => selectDeviceInstance(device)}
                        >
                            <Translation {...messages.TR_SELECT_DEVICE} />
                        </ChooseDevice>
                    )}
                </DeviceHeader>
            </Device>
            {!isUnknown && (
                <WalletsWrapper enabled={isWalletContext}>
                    {isWalletContext && (
                        <WalletsTooltips>
                            <RememberWallet
                                tooltipContent={
                                    <Translation {...messages.TR_REMEMBER_ALLOWS_YOU_TO} />
                                }
                            >
                                <Translation {...messages.TR_REMEMBER_WALLET} />
                            </RememberWallet>
                            <HideWallet
                                tooltipContent={
                                    <Translation {...messages.TR_HIDE_WALLET_EXPLANATION} />
                                }
                            >
                                <Translation {...messages.TR_HIDE_WALLET} />
                            </HideWallet>
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
                                data-test="@switch-device/add-hidden-wallet-button"
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
            )}
        </DeviceWrapper>
    );
};

export default injectIntl(DeviceItem);
