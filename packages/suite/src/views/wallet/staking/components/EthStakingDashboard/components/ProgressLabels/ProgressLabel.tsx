import { ReactNode, useEffect, useRef, useState } from 'react';
import styled, { DefaultTheme, useTheme } from 'styled-components';
import { Icon, variables } from '@trezor/components';
import { ProgressLabelState } from './types';
import { borders, spacingsPx } from '@trezor/theme';

const DEFAULT_LABEL_HEIGHT = 48;

const getProgressStateColor = ({
    theme,
    $progressState,
}: {
    theme: DefaultTheme;
    $progressState: ProgressLabelState;
}) => {
    if ($progressState === 'active') {
        return theme.backgroundAlertYellowSubtleOnElevation2;
    }

    if ($progressState === 'done') {
        return theme.backgroundPrimarySubtleOnElevation1;
    }

    return theme.backgroundSurfaceElevation2;
};

const ProgressLabelItem = styled.div<{
    $progressState: ProgressLabelState;
    $currentHeight?: number;
}>`
    background: ${({ theme, $progressState }) => getProgressStateColor({ theme, $progressState })};
    display: flex;
    gap: ${spacingsPx.sm};
    padding: ${spacingsPx.xs} ${spacingsPx.sm};
    align-items: center;
    border-radius: ${borders.radii.full};
    min-height: ${DEFAULT_LABEL_HEIGHT}px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${({ theme, $progressState }) => {
        if ($progressState === 'active') {
            return theme.textAlertYellow;
        }
        if ($progressState === 'done') {
            return theme.textPrimaryDefault;
        }

        return theme.textSubdued;
    }};

    &:not(:last-of-type) {
        position: relative;
        margin-right: ${spacingsPx.xs};
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;

        &::after {
            content: '';
            display: block;
            position: absolute;
            top: 0;
            right: -12px;
            z-index: 2;
            border-left: 12px solid
                ${({ theme, $progressState }) => getProgressStateColor({ theme, $progressState })};
            border-top: ${({ $currentHeight = DEFAULT_LABEL_HEIGHT }) => $currentHeight / 2}px solid
                transparent;
            border-bottom: ${({ $currentHeight = DEFAULT_LABEL_HEIGHT }) => $currentHeight / 2}px
                solid transparent;
        }
    }

    &:not(:first-of-type) {
        position: relative;
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
        padding-left: 20px;

        &::before {
            content: '';
            display: block;
            position: absolute;
            top: 0;
            left: 0;
            border-left: 12px solid ${({ theme }) => theme.backgroundSurfaceElevation1};
            border-top: ${({ $currentHeight = DEFAULT_LABEL_HEIGHT }) => $currentHeight / 2}px solid
                transparent;
            border-bottom: ${({ $currentHeight = DEFAULT_LABEL_HEIGHT }) => $currentHeight / 2}px
                solid transparent;
        }
    }
`;

const IconWrapper = styled.div<{ $progressState: ProgressLabelState }>`
    background: ${({ theme, $progressState }) => {
        if ($progressState === 'active') {
            return theme.backgroundAlertYellowSubtleOnElevation0;
        }
        if ($progressState === 'done') {
            return theme.backgroundPrimarySubtleOnElevation0;
        }

        return theme.backgroundSurfaceElevationNegative;
    }};
    border-radius: 100%;
    min-width: 24px;
    min-height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const IconDot = styled.div`
    width: 4px;
    height: 4px;
    border-radius: 100%;
    background: ${({ theme }) => theme.backgroundNeutralBold};
`;

interface ProgressLabelProps {
    children: ReactNode;
    progressState: ProgressLabelState;
}

export const ProgressLabel = ({ children, progressState = 'stale' }: ProgressLabelProps) => {
    const theme = useTheme();

    // Watch height to adjust element's edge shape sizes (triangle, flag tale)
    const ref = useRef<HTMLDivElement>(null);
    const [currentHeight, setCurrentHeight] = useState(DEFAULT_LABEL_HEIGHT);
    useEffect(() => {
        if (ref.current === null) return;

        const resizeObserver = new ResizeObserver(() => {
            const clientHeight = ref.current?.clientHeight ?? DEFAULT_LABEL_HEIGHT;
            if (clientHeight !== currentHeight) {
                setCurrentHeight(clientHeight);
            }
        });

        resizeObserver.observe(ref.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, [currentHeight]);

    const getProgressStateIcon = () => {
        if (progressState === 'active') {
            return <Icon icon="SPINNER" size={20} color={theme.iconAlertYellow} />;
        }

        if (progressState === 'done') {
            return <Icon icon="CHECK" size={16} color={theme.backgroundPrimaryDefault} />;
        }

        return <IconDot />;
    };

    return (
        <ProgressLabelItem ref={ref} $progressState={progressState} $currentHeight={currentHeight}>
            <IconWrapper $progressState={progressState}>{getProgressStateIcon()}</IconWrapper>
            {children}
        </ProgressLabelItem>
    );
};
