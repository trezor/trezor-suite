import { useState, useEffect, useRef } from 'react';
import styled, { css } from 'styled-components';
import { selectDevicesCount, selectDevice } from '@suite-common/wallet-core';
import type { Timeout } from '@trezor/type-utils';
import { SHAKE } from 'src/support/suite/styles/animations';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { borders, spacingsPx } from '@trezor/theme';
import { focusStyleTransition, getFocusShadowStyle } from '@trezor/components/src/utils/utils';
import { SidebarDeviceStatus } from './SidebarDeviceStatus';
import { ViewOnlyTooltip } from 'src/views/view-only/ViewOnlyTooltip';
import { Icon } from '@trezor/components';

const CaretContainer = styled.div`
    background: transparent;
    padding: 10px;
    border-radius: 50%;
    transition: background 0.15s;
`;

const Wrapper = styled.div<{ $isAnimationTriggered?: boolean }>`
    width: 100%;
    padding: ${spacingsPx.md} ${spacingsPx.md} ${spacingsPx.md} ${spacingsPx.md};
    align-items: center;
    border-radius: ${borders.radii.sm};
    border: 1px solid transparent;
    transition: ${focusStyleTransition};
    white-space: nowrap;

    ${getFocusShadowStyle()};

    &:hover {
        ${CaretContainer} {
            background: ${({ theme }) => theme.backgroundTertiaryPressedOnElevation0};
        }
    }

    ${({ $isAnimationTriggered }) =>
        $isAnimationTriggered &&
        css`
            animation: ${SHAKE} 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
            transform: translate3d(0, 0, 0);
            backface-visibility: hidden; /* used for hardware acceleration */
            perspective: 1000px; /* used for hardware acceleration */
        `}
`;

const InnerContainer = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    cursor: pointer;
    gap: ${spacingsPx.md};
`;

export const DeviceSelector = () => {
    const selectedDevice = useSelector(selectDevice);

    const deviceCount = useSelector(selectDevicesCount);
    const dispatch = useDispatch();

    const [localCount, setLocalCount] = useState<number | null>(null);
    const [isAnimationTriggered, setIsAnimationTriggered] = useState(false);

    const countChanged = localCount && localCount !== deviceCount;
    const shakeAnimationTimerRef = useRef<Timeout | undefined>(undefined);
    const stateAnimationTimerRef = useRef<Timeout | undefined>(undefined);

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

    return (
        <Wrapper $isAnimationTriggered={isAnimationTriggered}>
            <ViewOnlyTooltip>
                <InnerContainer
                    onClick={handleSwitchDeviceClick}
                    tabIndex={0}
                    data-testid="@menu/switch-device"
                >
                    <SidebarDeviceStatus />

                    {selectedDevice && selectedDevice.state && (
                        <CaretContainer>
                            <Icon size={20} name="caretCircleDown" />
                        </CaretContainer>
                    )}
                </InnerContainer>
            </ViewOnlyTooltip>
        </Wrapper>
    );
};
