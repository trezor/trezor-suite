import { useState, useEffect, useRef, MouseEventHandler } from 'react';

import styled, { css } from 'styled-components';

import { Image, Icon, DeviceAnimation } from '@trezor/components';
import { selectDevicesCount, selectDevice, acquireDevice } from '@suite-common/wallet-core';
import * as deviceUtils from '@suite-common/suite-utils';
import type { Timeout } from '@trezor/type-utils';
import { SHAKE } from 'src/support/suite/styles/animations';
import { TrezorDevice } from 'src/types/suite';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { DeviceModelInternal } from '@trezor/connect';
import { DeviceStatusText } from 'src/views/suite/SwitchDevice/DeviceItem/DeviceStatusText';
import { borders, spacingsPx, typography } from '@trezor/theme';
import { selectLabelingDataForWallet } from 'src/reducers/suite/metadataReducer';
import { focusStyleTransition, getFocusShadowStyle } from '@trezor/components/src/utils/utils';
import { useWalletLabeling } from '../../../labeling/WalletLabeling';

const CaretContainer = styled.div`
    background: transparent;
    padding: 10px;
    border-radius: 50%;
    transition: background 0.15s;
`;

const Wrapper = styled.div<{ isAnimationTriggered?: boolean }>`
    position: relative;
    display: flex;
    gap: ${spacingsPx.md};
    width: 100%;
    padding: ${spacingsPx.md} ${spacingsPx.md} ${spacingsPx.md} ${spacingsPx.md};
    align-items: center;
    cursor: pointer;
    border-radius: ${borders.radii.sm};
    border: 1px solid transparent;
    transition: ${focusStyleTransition};

    ${getFocusShadowStyle()};

    :hover {
        ${CaretContainer} {
            background: ${({ theme }) => theme.backgroundTertiaryPressedOnElevation0};
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
    ${typography.body};
    margin-bottom: -${spacingsPx.xxs};
    min-width: 0;
    color: ${({ theme }) => theme.textDefault};
    overflow: hidden;
    text-overflow: ellipsis;
`;

const DeviceWrapper = styled.div<{ isLowerOpacity: boolean }>`
    display: flex;
    opacity: ${({ isLowerOpacity }) => isLowerOpacity && 0.4};
`;

const StyledImage = styled(Image)`
    width: 24px;

    /* do not apply the darkening filter in dark mode on device images */
    filter: none;
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
    const selectedDevice = useSelector(selectDevice);
    const { walletLabel } = useSelector(state =>
        selectLabelingDataForWallet(state, selectedDevice?.state),
    );
    const deviceCount = useSelector(selectDevicesCount);
    const dispatch = useDispatch();

    const [localCount, setLocalCount] = useState<number | null>(null);
    const [isAnimationTriggered, setIsAnimationTriggered] = useState(false);

    const countChanged = localCount && localCount !== deviceCount;
    const shakeAnimationTimerRef = useRef<Timeout | undefined>(undefined);
    const stateAnimationTimerRef = useRef<Timeout | undefined>(undefined);

    const deviceNeedsRefresh = needsRefresh(selectedDevice);
    const selectedDeviceModelInternal = selectedDevice?.features?.internal_model;

    const { defaultAccountLabelString } = useWalletLabeling();
    const defaultWalletLabel =
        selectedDevice !== undefined
            ? defaultAccountLabelString({ device: selectedDevice })
            : undefined;

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

    const handleSwitchDeviceClick = () =>
        dispatch(
            goto('suite-switch-device', {
                params: {
                    cancelable: true,
                },
            }),
        );

    const handleRefreshClick: MouseEventHandler = e => {
        e.stopPropagation();
        if (deviceNeedsRefresh) {
            dispatch(acquireDevice(selectedDevice));
        }
    };

    return (
        <Wrapper
            data-test="@menu/switch-device"
            onClick={handleSwitchDeviceClick}
            isAnimationTriggered={isAnimationTriggered}
            tabIndex={0}
        >
            {selectedDevice && selectedDeviceModelInternal && (
                <>
                    <DeviceWrapper isLowerOpacity={deviceNeedsRefresh}>
                        {selectedDeviceModelInternal === DeviceModelInternal.T2B1 && (
                            <DeviceAnimation
                                type="ROTATE"
                                height="34px"
                                width="24px"
                                deviceModelInternal={selectedDeviceModelInternal}
                                deviceUnitColor={selectedDevice?.features?.unit_color}
                            />
                        )}

                        {selectedDeviceModelInternal !== DeviceModelInternal.T2B1 && (
                            <StyledImage
                                alt="Trezor"
                                image={`TREZOR_${selectedDeviceModelInternal}`}
                            />
                        )}
                    </DeviceWrapper>

                    <DeviceDetail>
                        <DeviceLabel>{selectedDevice.label}</DeviceLabel>

                        <DeviceStatusText
                            onRefreshClick={handleRefreshClick}
                            device={selectedDevice}
                            walletLabel={
                                walletLabel === undefined || walletLabel.trim() === ''
                                    ? defaultWalletLabel
                                    : walletLabel
                            }
                        />
                    </DeviceDetail>

                    {selectedDevice.state && (
                        <CaretContainer>
                            <Icon size={20} icon="CARET_CIRCLE_DOWN" />
                        </CaretContainer>
                    )}
                </>
            )}
        </Wrapper>
    );
};
