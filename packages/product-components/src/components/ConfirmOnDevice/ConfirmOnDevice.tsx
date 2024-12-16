import { ReactNode } from 'react';

import styled, { css, keyframes } from 'styled-components';

import { DeviceModelInternal } from '@trezor/connect';
import { borders, spacingsPx } from '@trezor/theme';
import { ElevationUp } from '@trezor/components';

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

const Wrapper = styled.div<{ $animation?: AnimationDirection; $isCancelable?: boolean }>`
    padding: ${spacingsPx.sm} ${spacingsPx.sm} ${spacingsPx.sm} ${spacingsPx.xxl};
    border-radius: ${borders.radii.full};
    background: ${({ theme }) => theme.backgroundSurfaceElevation0};
    box-shadow: ${({ theme }) => theme.boxShadowBase};

    ${({ $isCancelable }) => !$isCancelable && `padding-right: ${spacingsPx.xxl};`}

    ${({ $animation }) =>
        $animation === AnimationDirection.Up &&
        css`
            animation: ${SLIDE_UP} 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        `}

    ${({ $animation }) =>
        $animation === AnimationDirection.Down &&
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

export const ConfirmOnDevice = ({ isConfirmed, ...rest }: ConfirmOnDeviceProps) => (
    <Wrapper
        $animation={isConfirmed ? AnimationDirection.Down : AnimationDirection.Up}
        $isCancelable={!!rest.onCancel}
        data-testid="@prompts/confirm-on-device"
        onClick={e => e.stopPropagation()}
    >
        <ElevationUp>
            <ConfirmOnDeviceContent {...rest} />
        </ElevationUp>
    </Wrapper>
);
