import React from 'react';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import styled from 'styled-components';
import { colors, variables } from '@trezor/components';
import { Translation } from '@suite-components';
import Card from '@suite-components/Card';
import * as deviceUtils from '@suite-utils/device';

import WalletInstance from '../WalletInstance/Container';
import { Props } from './Container';
import ColHeader from './components/ColHeader';
import DeviceImage from '@suite-components/images/DeviceImage';
import AddWalletButton from './components/AddWalletButton';
import DeviceHeaderButton from './components/DeviceHeaderButton';

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
        /* border-top: 2px solid ${colors.BLACK96}; */
    }
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
    margin-left: 78px;
    margin-right: 38px;
`;

const DeviceItem = (props: Props & WrappedComponentProps) => {
    const { device, selectedDevice, backgroundRoute } = props;
    const deviceStatus = deviceUtils.getStatus(device);
    const isUnknown = device.type !== 'acquired';
    const isSelected = deviceUtils.isSelectedDevice(selectedDevice, device);
    const isWalletContext =
        backgroundRoute &&
        (backgroundRoute.app === 'wallet' || backgroundRoute.app === 'dashboard');

    const selectDeviceInstance = async (instance: Props['device']) => {
        await props.selectDevice(instance);
        if (!isWalletContext) {
            await props.goto('suite-index');
        }
        props.closeModalApp(!isWalletContext);
    };

    const addDeviceInstance = async (instance: Props['device']) => {
        await props.createDeviceInstance(instance);
        if (!isWalletContext) {
            await props.goto('suite-index');
        }
        props.closeModalApp(!isWalletContext);
    };

    const onSolveIssueClick = () => {
        const needsAcquire =
            device.type === 'unacquired' ||
            deviceStatus === 'used-in-other-window' ||
            deviceStatus === 'was-used-in-other-window';
        if (needsAcquire) {
            props.acquireDevice(device);
        } else {
            selectDeviceInstance(device);
        }
    };

    const onDeviceSettingsClick = async () => {
        // await needed otherwise it just selects first account (???)
        await props.goto('settings-device');
        if (!isSelected) {
            await props.selectDevice(device);
        }
    };

    return (
        <DeviceWrapper>
            <Device>
                <DeviceHeader>
                    <DeviceImageWrapper>
                        <DeviceImage height={46} device={device} />
                    </DeviceImageWrapper>
                    <Col grow={1}>
                        <DeviceTitle>{device.label}</DeviceTitle>
                        <DeviceStatus color={device.connected ? colors.GREEN : colors.BLACK50}>
                            {device.connected ? (
                                <Translation id="TR_CONNECTED" />
                            ) : (
                                <Translation id="TR_DISCONNECTED" />
                            )}
                        </DeviceStatus>
                    </Col>

                    <DeviceHeaderButton
                        device={device}
                        onSolveIssueClick={onSolveIssueClick}
                        onDeviceSettingsClick={onDeviceSettingsClick}
                    />
                </DeviceHeader>
            </Device>
            {!isUnknown && (
                <WalletsWrapper enabled>
                    <WalletsTooltips>
                        <RememberWallet
                            tooltipContent={<Translation id="TR_REMEMBER_ALLOWS_YOU_TO" />}
                        >
                            <Translation id="TR_REMEMBER_HEADING" />
                        </RememberWallet>
                        <HideWallet
                            tooltipContent={<Translation id="TR_EJECT_WALLET_EXPLANATION" />}
                        >
                            <Translation id="TR_EJECT_HEADING" />
                        </HideWallet>
                    </WalletsTooltips>

                    <InstancesWrapper noPadding>
                        {props.instances.map(instance => (
                            <StyledWalletInstance
                                key={`${instance.label}-${instance.instance}-${instance.state}`}
                                instance={instance}
                                enabled
                                selected={deviceUtils.isSelectedInstance(selectedDevice, instance)}
                                selectDeviceInstance={selectDeviceInstance}
                            />
                        ))}
                    </InstancesWrapper>

                    <AddWalletButton
                        device={device}
                        instances={props.instances}
                        addDeviceInstance={addDeviceInstance}
                        selectDeviceInstance={selectDeviceInstance}
                    />
                </WalletsWrapper>
            )}
        </DeviceWrapper>
    );
};

export default injectIntl(DeviceItem);
