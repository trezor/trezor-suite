import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';
import { colors, variables, Icon, DeviceImage } from '@trezor/components';
import { Translation } from '@suite-components';
import * as deviceUtils from '@suite-utils/device';
import { ANIMATION } from '@suite-config';

import WalletInstance from '../WalletInstance/Container';
import { Props } from './Container';
import ColHeader from './components/ColHeader';
import AddWalletButton from './components/AddWalletButton';
import DeviceHeaderButton from './components/DeviceHeaderButton';

const DeviceWrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;

    & + & {
        margin-top: 50px;
    }
`;

const Device = styled.div`
    display: flex;
    align-items: center;
`;

const DeviceTitle = styled.span`
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.NEUE_TYPE_DARK_GREY};
`;

const DeviceStatus = styled.span<{ color: string }>`
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: 600;
    text-transform: uppercase;
    color: ${props => props.color};
    margin-bottom: 2px;
`;

const DeviceActions = styled.div`
    display: flex;
    align-items: center;
    margin-left: 20px;
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
    margin-left: 37px;
    margin-top: 24px;
`;

const WalletsTooltips = styled.div`
    display: flex;
    justify-content: flex-end;
    padding-bottom: 10px;
`;

const WalletsCount = styled(ColHeader)`
    flex: 1;
    justify-content: flex-start;
    white-space: nowrap;
`;

const InstancesWrapper = styled.div`
    display: flex;
    flex-direction: column;
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
    width: 21px;
    height: 36px;
    margin-right: 16px;
`;

const ExpandIcon = styled(Icon)`
    margin-left: 24px;
`;

// TODO: this is going to be a problem with different col headers length since they won't be aligned with the columns inside WalletInstance
const ColRememberHeader = styled(ColHeader)`
    margin: 0 24px;
`;
const ColEjectHeader = styled(ColHeader)`
    margin: 0px 24px;
`;

const DeviceItem = (props: Props) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [animateArrow, setAnimateArrow] = useState(false);

    const { device, selectedDevice, backgroundRoute } = props;

    const deviceStatus = deviceUtils.getStatus(device);
    const needsAttention = deviceUtils.deviceNeedsAttention(deviceStatus);
    const isUnknown = device.type !== 'acquired';
    const isSelected = deviceUtils.isSelectedDevice(selectedDevice, device);
    const isWalletContext =
        backgroundRoute &&
        (backgroundRoute.app === 'wallet' || backgroundRoute.app === 'dashboard');
    const instancesWithState = props.instances.filter(i => i.state);

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
                        <DeviceImage
                            height={36}
                            trezorModel={device.features?.major_version === 1 ? 1 : 2}
                        />
                    </DeviceImageWrapper>
                    <Col grow={1}>
                        <DeviceStatus
                            color={
                                device.connected
                                    ? colors.NEUE_TYPE_GREEN
                                    : colors.NEUE_TYPE_LIGHT_GREY
                            }
                        >
                            {device.connected ? (
                                <Translation id="TR_CONNECTED" />
                            ) : (
                                <Translation id="TR_DISCONNECTED" />
                            )}
                        </DeviceStatus>
                        <DeviceTitle>{device.label}</DeviceTitle>
                    </Col>

                    <DeviceActions>
                        <DeviceHeaderButton
                            needsAttention={needsAttention}
                            device={device}
                            onSolveIssueClick={onSolveIssueClick}
                            onDeviceSettingsClick={onDeviceSettingsClick}
                        />
                        {!needsAttention && (
                            <ExpandIcon
                                useCursorPointer
                                size={24}
                                icon="ARROW_UP"
                                color={colors.NEUE_TYPE_LIGHT_GREY}
                                canAnimate={animateArrow}
                                isActive={!isExpanded}
                                onClick={() => {
                                    setIsExpanded(!isExpanded);
                                    setAnimateArrow(true);
                                }}
                            />
                        )}
                    </DeviceActions>
                </DeviceHeader>
            </Device>
            {!needsAttention && (
                <AnimatePresence initial={false}>
                    {!isUnknown && isExpanded && (
                        <motion.div {...ANIMATION.EXPAND}>
                            <WalletsWrapper enabled>
                                {instancesWithState.length > 0 && (
                                    <WalletsTooltips>
                                        <WalletsCount>
                                            <Translation
                                                id="TR_COUNT_WALLETS"
                                                values={{ count: instancesWithState.length }}
                                            />
                                        </WalletsCount>
                                        <ColRememberHeader
                                            tooltipContent={
                                                <Translation id="TR_REMEMBER_ALLOWS_YOU_TO" />
                                            }
                                        >
                                            <Translation id="TR_REMEMBER_HEADING" />
                                        </ColRememberHeader>
                                        <ColEjectHeader
                                            tooltipContent={
                                                <Translation id="TR_EJECT_WALLET_EXPLANATION" />
                                            }
                                        >
                                            <Translation id="TR_EJECT_HEADING" />
                                        </ColEjectHeader>
                                    </WalletsTooltips>
                                )}

                                <InstancesWrapper>
                                    {instancesWithState.map((instance, index) => (
                                        <StyledWalletInstance
                                            key={`${instance.id}-${instance.instance}-${instance.state}`}
                                            instance={instance}
                                            enabled
                                            selected={deviceUtils.isSelectedInstance(
                                                selectedDevice,
                                                instance,
                                            )}
                                            selectDeviceInstance={selectDeviceInstance}
                                            index={index}
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
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </DeviceWrapper>
    );
};

export default DeviceItem;
