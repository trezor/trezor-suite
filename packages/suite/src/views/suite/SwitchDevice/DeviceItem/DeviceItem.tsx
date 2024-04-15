import { useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import styled, { useTheme } from 'styled-components';
import { variables, Icon, motionAnimation } from '@trezor/components';
import * as deviceUtils from '@suite-common/suite-utils';

import {
    selectDevice,
    acquireDevice,
    createDeviceInstance,
    selectDeviceThunk,
} from '@suite-common/wallet-core';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';

import { WalletInstance } from './WalletInstance';
import { AddWalletButton } from './AddWalletButton';
import { DeviceHeaderButton } from './DeviceHeaderButton';

import type { TrezorDevice, AcquiredDevice, ForegroundAppProps } from 'src/types/suite';
import type { getBackgroundRoute } from 'src/utils/suite/router';
import { spacingsPx } from '@trezor/theme';
import { DeviceStatus } from 'src/components/suite/layouts/SuiteLayout/DeviceSelector/DeviceStatus';
import { isWebUsb } from 'src/utils/suite/transport';
import { WebUsbButton } from 'src/components/suite';

const DeviceWrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: ${spacingsPx.xs};

    & + & {
        margin-top: ${spacingsPx.xxxl};
    }
`;

const Device = styled.div`
    display: flex;
    align-items: center;
`;

const DeviceActions = styled.div`
    display: flex;
    align-items: center;
    margin-left: ${spacingsPx.lg};
    gap: ${spacingsPx.xxs};
`;

const WalletsWrapper = styled.div<{ $enabled: boolean }>`
    opacity: ${({ $enabled }) => ($enabled ? 1 : 0.5)};
    pointer-events: ${({ $enabled }) => ($enabled ? 'unset' : 'none')};
    padding-bottom: ${({ $enabled }) => ($enabled ? '0px' : '24px')};

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        margin-left: 0;
    }
`;

const InstancesWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xs};
`;

const DeviceHeader = styled.div`
    display: flex;
    align-items: center;
    flex: 1;
    cursor: pointer;
`;

interface DeviceItemProps {
    device: TrezorDevice;
    instances: AcquiredDevice[];
    onCancel: ForegroundAppProps['onCancel'];
    backgroundRoute: ReturnType<typeof getBackgroundRoute>;
}

export const DeviceItem = ({ device, instances, onCancel, backgroundRoute }: DeviceItemProps) => {
    const selectedDevice = useSelector(selectDevice);
    const dispatch = useDispatch();
    const transport = useSelector(state => state.suite.transport);

    const isWebUsbTransport = isWebUsb(transport);
    const theme = useTheme();
    const [isExpanded, setIsExpanded] = useState(true);

    const deviceStatus = deviceUtils.getStatus(device);
    const deviceModelInternal = device.features?.internal_model;

    const needsAttention = deviceUtils.deviceNeedsAttention(deviceStatus);
    const isUnknown = device.type !== 'acquired';
    const instancesWithState = instances.filter(i => i.state);

    const handleRedirection = async () => {
        // Preserve route for dashboard or wallet context only. Redirect from other routes to dashboard index.
        const isWalletOrDashboardContext =
            backgroundRoute && ['wallet', 'dashboard'].includes(backgroundRoute.app);
        if (!isWalletOrDashboardContext) {
            await dispatch(goto('suite-index'));
        }

        // Subpaths of wallet are not available to all account types (e.g. Tokens tab not available to BTC accounts).
        const isWalletSubpath =
            backgroundRoute?.app === 'wallet' && backgroundRoute?.name !== 'wallet-index';
        if (isWalletSubpath) {
            await dispatch(goto('wallet-index'));
        }

        const preserveParams = false;
        onCancel(preserveParams);
    };

    const selectDeviceInstance = (instance: DeviceItemProps['device']) => {
        dispatch(selectDeviceThunk(instance));
        handleRedirection();
    };

    const addDeviceInstance = async (instance: DeviceItemProps['device']) => {
        await dispatch(createDeviceInstance({ device: instance }));
        handleRedirection();
    };

    const onSolveIssueClick = () => {
        const needsAcquire =
            device.type === 'unacquired' ||
            deviceStatus === 'used-in-other-window' ||
            deviceStatus === 'was-used-in-other-window';
        if (needsAcquire) {
            dispatch(acquireDevice(device));
        } else {
            selectDeviceInstance(device);
        }
    };

    return (
        <DeviceWrapper>
            <Device>
                <DeviceHeader onClick={() => onCancel()}>
                    {deviceModelInternal && (
                        <DeviceStatus deviceModel={deviceModelInternal} device={selectedDevice} />
                    )}

                    <DeviceActions>
                        {isWebUsbTransport && <WebUsbButton variant="tertiary" size="small" />}
                        <motion.div
                            animate={{
                                rotate: 180,
                            }}
                            style={{ originX: '50%', originY: '50%' }}
                        >
                            <Icon
                                useCursorPointer
                                size={20}
                                icon="CARET_CIRCLE_DOWN"
                                color={theme.TYPE_LIGHT_GREY}
                                hoverColor={theme.TYPE_LIGHTER_GREY}
                                onClick={() => setIsExpanded(!isExpanded)}
                            />
                        </motion.div>
                    </DeviceActions>
                </DeviceHeader>
            </Device>
            <DeviceHeaderButton
                needsAttention={needsAttention}
                device={device}
                onSolveIssueClick={onSolveIssueClick}
            />
            {!needsAttention && (
                <AnimatePresence initial={false}>
                    {!isUnknown && isExpanded && (
                        <motion.div {...motionAnimation.expand}>
                            <WalletsWrapper $enabled>
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
