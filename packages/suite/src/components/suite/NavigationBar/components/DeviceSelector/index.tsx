import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled, { css } from 'styled-components';
import { analytics, EventType } from '@trezor/suite-analytics';

import { variables, DeviceImage, Icon } from '@trezor/components';
import { SHAKE } from '@suite-support/styles/animations';
import { WalletLabeling } from '@suite-components';
import { TrezorDevice } from '@suite-types';
import * as routerActions from '@suite-actions/routerActions';
import { useSelector, useActions } from '@suite-hooks';
import * as suiteActions from '@suite-actions/suiteActions';
import * as deviceUtils from '@suite-utils/device';
import { DeviceStatus } from './DeviceStatus';
import { transparentize } from 'polished';
import type { Timeout } from '@suite/types/utils';

const ArrowDown = styled(Icon)`
    margin-left: 4px;
`;

const Wrapper = styled.div<{ isAnimationTriggered?: boolean }>`
    display: flex;
    position: relative;
    min-width: 200px;
    height: 48px;
    padding: 6px 12px;
    align-items: center;
    margin-right: 24px;
    cursor: pointer;

    :hover {
        border-radius: 8px;
        background-color: ${({ theme }) =>
            transparentize(theme.HOVER_TRANSPARENTIZE_FILTER, theme.HOVER_PRIMER_COLOR)};

        ${ArrowDown} {
            path {
                fill: ${({ theme }) => theme.TYPE_DARK_GREY};
            }
        }
    }

    ${({ isAnimationTriggered }) =>
        isAnimationTriggered &&
        css`
            animation: ${SHAKE} 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
            transform: translate3d(0, 0, 0);
            backface-visibility: hidden; /* used for hardware acceleration */
            perspective: 1000px; /* used for hardware acceleration */
        `}
`;

const DeviceLabel = styled.div`
    display: flex;
    min-width: 0;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    overflow: hidden;
    text-overflow: ellipsis;

    > :first-child {
        margin-right: 6px;
    }
`;

const StyledDeviceImage = styled(DeviceImage)<{ isLowerOpacity: boolean }>`
    margin-right: 14px;
    flex: 0;
    opacity: ${({ isLowerOpacity }) => isLowerOpacity && 0.4};
`;

const WalletNameWrapper = styled.div`
    display: flex;
    min-width: 0;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const DeviceDetail = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow: hidden;
    align-self: baseline;
`;

const needsRefresh = (device?: TrezorDevice) => {
    if (!device) return false;

    const deviceStatus = deviceUtils.getStatus(device);
    const needsAcquire =
        device.type === 'unacquired' ||
        deviceStatus === 'used-in-other-window' ||
        deviceStatus === 'was-used-in-other-window';

    return needsAcquire;
};

export const DeviceSelector = () => {
    const { selectedDevice, deviceCount } = useSelector(state => ({
        selectedDevice: state.suite.device,
        deviceCount: state.devices.length,
    }));

    const { goto, acquireDevice } = useActions({
        goto: routerActions.goto,
        acquireDevice: suiteActions.acquireDevice,
    });

    const [localCount, setLocalCount] = useState<number | null>(null);
    const [isAnimationTriggered, setIsAnimationTriggered] = useState(false);
    const [showTextStatus, setShowTextStatus] = useState(false);

    const countChanged = localCount && localCount !== deviceCount;
    const shakeAnimationTimerRef = useRef<Timeout | undefined>(undefined);
    const stateAnimationTimerRef = useRef<Timeout | undefined>(undefined);

    const deviceNeedsRefresh = needsRefresh(selectedDevice);

    const connectState = selectedDevice?.connected;

    useEffect(
        () =>
            // clear animation timers on unmount
            () => {
                if (shakeAnimationTimerRef.current) clearTimeout(shakeAnimationTimerRef.current);
                if (stateAnimationTimerRef.current) clearTimeout(stateAnimationTimerRef.current);
            },
        [],
    );

    useEffect(() => {
        // update previous device count
        setLocalCount(deviceCount);
    }, [deviceCount]);

    useEffect(() => {
        if (countChanged) {
            // different count triggers anim
            setIsAnimationTriggered(true);
            // after 1s removes anim, allowing it to restart later
            shakeAnimationTimerRef.current = setTimeout(() => {
                // makes sure component is still mounted
                setIsAnimationTriggered(false);
            }, 1000);
        }
    }, [countChanged]);

    useEffect(() => {
        // if the device status changes, show wallet state (dis/connected) as text for 2 seconds
        setShowTextStatus(true);
        stateAnimationTimerRef.current = setTimeout(() => {
            setShowTextStatus(false);
        }, 2000);
    }, [connectState]);

    const switchDevice = useCallback(() => {
        goto('suite-switch-device', {
            params: {
                cancelable: true,
            },
        });
        analytics.report({ type: EventType.MenuGotoSwitchDevice });
    }, [goto]);

    const handleRefreshClick = useCallback(() => {
        if (deviceNeedsRefresh) {
            acquireDevice(selectedDevice);
        }
    }, [deviceNeedsRefresh, selectedDevice, acquireDevice]);

    return (
        <Wrapper
            data-test="@menu/switch-device"
            onClick={switchDevice}
            isAnimationTriggered={isAnimationTriggered}
        >
            {selectedDevice && (
                <>
                    <StyledDeviceImage
                        height={34}
                        trezorModel={selectedDevice.features?.major_version === 1 ? 1 : 2}
                        isLowerOpacity={deviceNeedsRefresh}
                    />

                    <DeviceDetail>
                        <DeviceLabel>
                            <span>{selectedDevice.label}</span>
                            <DeviceStatus
                                showTextStatus={showTextStatus}
                                device={selectedDevice}
                                onRefreshClick={handleRefreshClick}
                            />
                        </DeviceLabel>

                        {selectedDevice.state && (
                            <WalletNameWrapper>
                                {selectedDevice.metadata.status === 'enabled' &&
                                selectedDevice.metadata.walletLabel ? (
                                    selectedDevice.metadata.walletLabel
                                ) : (
                                    <WalletLabeling device={selectedDevice} />
                                )}

                                <ArrowDown icon="ARROW_DOWN" size={16} />
                            </WalletNameWrapper>
                        )}
                    </DeviceDetail>
                </>
            )}
        </Wrapper>
    );
};
