import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';
import { useTheme, variables, Icon, DeviceImage } from '@trezor/components';
import { Translation } from '@suite-components';
import * as deviceUtils from '@suite-utils/device';
import { ANIMATION } from '@suite-config';
import { TrezorDevice, AcquiredDevice, InjectedModalApplicationProps } from '@suite-types';
import { useSelector, useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';
import * as suiteActions from '@suite-actions/suiteActions';
import { OpenGuideFromTooltip } from '@suite-views/guide';

import WalletInstance from '../WalletInstance';
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
    color: ${props => props.theme.TYPE_DARK_GREY};
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

interface Props {
    device: TrezorDevice;
    instances: AcquiredDevice[];
    closeModalApp: InjectedModalApplicationProps['closeModalApp'];
    backgroundRoute: ReturnType<InjectedModalApplicationProps['getBackgroundRoute']>;
}

const DeviceItem = ({ device, instances, closeModalApp, backgroundRoute }: Props) => {
    const { goto, selectDevice, acquireDevice, createDeviceInstance } = useActions({
        goto: routerActions.goto,
        selectDevice: suiteActions.selectDevice,
        acquireDevice: suiteActions.acquireDevice,
        createDeviceInstance: suiteActions.createDeviceInstance,
    });
    const selectedDevice = useSelector(state => state.suite.device);

    const theme = useTheme();
    const [isExpanded, setIsExpanded] = useState(true);
    const [animateArrow, setAnimateArrow] = useState(false);

    const deviceStatus = deviceUtils.getStatus(device);
    const needsAttention = deviceUtils.deviceNeedsAttention(deviceStatus);
    const isUnknown = device.type !== 'acquired';
    const isSelected = deviceUtils.isSelectedDevice(selectedDevice, device);
    const instancesWithState = instances.filter(i => i.state);

    const handleRedirection = async () => {
        // Preserve route for dashboard or wallet context only. Redirect from other routes to dashboard index.
        const isWalletOrDashboardContext =
            backgroundRoute && ['wallet', 'dashboard'].includes(backgroundRoute.app);
        if (!isWalletOrDashboardContext) {
            await goto('suite-index');
        }

        // Subpaths of wallet are not available to all account types (e.g. Tokens tab not available to BTC accounts).
        const isWalletSubpath =
            backgroundRoute?.app === 'wallet' && backgroundRoute?.name !== 'wallet-index';
        if (isWalletSubpath) {
            await goto('wallet-index');
        }

        const preserveParams = false;
        closeModalApp(preserveParams);
    };

    const selectDeviceInstance = (instance: Props['device']) => {
        selectDevice(instance);
        handleRedirection();
    };

    const addDeviceInstance = async (instance: Props['device']) => {
        await createDeviceInstance(instance);
        handleRedirection();
    };

    const onSolveIssueClick = () => {
        const needsAcquire =
            device.type === 'unacquired' ||
            deviceStatus === 'used-in-other-window' ||
            deviceStatus === 'was-used-in-other-window';
        if (needsAcquire) {
            acquireDevice(device);
        } else {
            selectDeviceInstance(device);
        }
    };

    const onDeviceSettingsClick = async () => {
        // await needed otherwise it just selects first account (???)
        await goto('settings-device');
        if (!isSelected) {
            selectDevice(device);
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
                        <DeviceStatus color={device.connected ? theme.TYPE_GREEN : theme.TYPE_RED}>
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
                                color={theme.TYPE_LIGHT_GREY}
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
                                                <>
                                                    <Translation id="TR_REMEMBER_ALLOWS_YOU_TO" />
                                                    <OpenGuideFromTooltip id="/privacy/remember-and-eject.md" />
                                                </>
                                            }
                                        >
                                            <Translation id="TR_REMEMBER_HEADING" />
                                        </ColRememberHeader>
                                        <ColEjectHeader
                                            tooltipContent={
                                                <>
                                                    <Translation id="TR_EJECT_WALLET_EXPLANATION" />
                                                    <OpenGuideFromTooltip id="/privacy/remember-and-eject.md" />
                                                </>
                                            }
                                        >
                                            <Translation id="TR_EJECT_HEADING" />
                                        </ColEjectHeader>
                                    </WalletsTooltips>
                                )}

                                <InstancesWrapper>
                                    {instancesWithState.map((instance, index) => (
                                        <WalletInstance
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
                                    instances={instances}
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
