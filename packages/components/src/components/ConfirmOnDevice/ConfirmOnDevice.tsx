import { ReactNode } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { DeviceModelInternal } from '@trezor/connect';
import { borders, spacingsPx } from '@trezor/theme';

import { ElevationContext, useElevation } from '../ElevationContext/ElevationContext';
import { ConfirmOnDeviceContent } from './ConfirmOnDeviceContent';

enum AnimationDirection {
    Up,
    Down,
}

export const SLIDE_UP = keyframes`
    0% {
        transform: translateY(150%);
    }
    100% {
        transform: translateY(0%);
    }
`;

export const SLIDE_DOWN = keyframes`
    0% {
        transform: translateY(0%);
        opacity: 1;
    }
    100% {
        transform: translateY(150%);
        opacity: 0;
    }
`;

const Wrapper = styled.div<{ animation?: AnimationDirection }>`
    display: flex;
    width: 300px;
    height: 62px;
    padding: 0 ${spacingsPx.md} 0 ${spacingsPx.xxl};
    border-radius: ${borders.radii.full};
    background: ${({ theme }) => theme.backgroundSurfaceElevation1};
    box-shadow: ${({ theme }) => theme.boxShadowBase};
    align-items: center;

    ${({ animation }) =>
        animation === AnimationDirection.Up &&
        css`
            animation: ${SLIDE_UP} 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        `}

    ${({ animation }) =>
        animation === AnimationDirection.Down &&
        css`
            animation: ${SLIDE_DOWN} 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        `}
`;

export interface ConfirmOnDeviceProps {
    title: ReactNode;
    successText?: ReactNode;
    steps?: number;
    activeStep?: number;
    isConfirmed?: boolean;
    onCancel?: () => void;
    deviceModelInternal?: DeviceModelInternal;
    deviceUnitColor?: number;
}

export const ConfirmOnDevice = ({ isConfirmed, ...rest }: ConfirmOnDeviceProps) => {
    const { elevation } = useElevation();

    return (
        <Wrapper
            animation={isConfirmed ? AnimationDirection.Down : AnimationDirection.Up}
            data-test="@prompts/confirm-on-device"
        >
            <ElevationContext baseElevation={elevation}>
                <ConfirmOnDeviceContent {...rest} />
            </ElevationContext>
        </Wrapper>
    );
};
