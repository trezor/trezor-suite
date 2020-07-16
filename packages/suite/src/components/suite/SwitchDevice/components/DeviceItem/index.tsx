import React, { useState } from 'react';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';
import { colors, variables, Icon, DeviceImage } from '@trezor/components';
import { Translation } from '@suite-components';
import * as deviceUtils from '@suite-utils/device';

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
        margin-top: 64px;
    }
`;

const Device = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 24px;
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
`;

const WalletsTooltips = styled.div`
    display: flex;
    justify-content: flex-end;
    padding-bottom: 10px;
`;

const WalletsCount = styled(ColHeader)`
    flex: 1;
    justify-content: flex-start;
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

const ANIMATION = {
    variants: {
        initial: {
            overflow: 'hidden',
            height: 0,
        },
        visible: {
            height: 'auto',
        },
    },
    initial: 'initial',
    animate: 'visible',
    exit: 'initial',
    transition: { duration: 0.15, ease: 'easeInOut' },
};

const DeviceItem = (props: Props & WrappedComponentProps) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [animateArrow, setAnimateArrow] = useState(false);

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
                            device={device}
                            onSolveIssueClick={onSolveIssueClick}
                            onDeviceSettingsClick={onDeviceSettingsClick}
                        />
                        <ExpandIcon
                            usePointerCursor
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
                    </DeviceActions>
                </DeviceHeader>
            </Device>
            <AnimatePresence initial={false}>
                {!isUnknown && isExpanded && (
                    <motion.div {...ANIMATION}>
                        <WalletsWrapper enabled>
                            <WalletsTooltips>
                                <WalletsCount>
                                    <Translation
                                        id="TR_COUNT_WALLETS"
                                        values={{ count: props.instances.length }}
                                    />
                                </WalletsCount>
                                <ColRememberHeader
                                    tooltipContent={<Translation id="TR_REMEMBER_ALLOWS_YOU_TO" />}
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

                            <InstancesWrapper>
                                {props.instances.map(instance => (
                                    <StyledWalletInstance
                                        key={`${instance.label}-${instance.instance}-${instance.state}`}
                                        instance={instance}
                                        enabled
                                        selected={deviceUtils.isSelectedInstance(
                                            selectedDevice,
                                            instance,
                                        )}
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
                    </motion.div>
                )}
            </AnimatePresence>
        </DeviceWrapper>
    );
};

export default injectIntl(DeviceItem);
