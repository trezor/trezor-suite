import { ReactNode, useEffect, useRef, useState } from 'react';
import styled, { DefaultTheme } from 'styled-components';
import { Icon, useTheme, variables, Image } from '@trezor/components';
import { ProgressLabelState } from './types';

const DEFAULT_LABEL_HEIGHT = 48;

const getProgressStateColor = ({
    theme,
    $progressState,
    // TODO: Hack for current design. Remove when not needed.
    $isIconWrapper = false,
}: {
    theme: DefaultTheme;
    $progressState: ProgressLabelState;
    $isIconWrapper?: boolean;
}) => {
    if ($progressState === 'active') {
        return theme.TYPE_LIGHT_ORANGE;
    }

    if ($progressState === 'done') {
        return theme.BG_LIGHT_GREEN;
    }

    return $isIconWrapper ? theme.STROKE_GREY : theme.BG_GREY;
};

const ProgressLabelItem = styled.div<{
    ref: any;
    $progressState: ProgressLabelState;
    $currentHeight?: number;
}>`
    background: ${({ theme, $progressState }) => getProgressStateColor({ theme, $progressState })};
    display: flex;
    gap: 12px;
    padding: 8px 12px;
    align-items: center;
    border-radius: 25px;
    min-height: ${DEFAULT_LABEL_HEIGHT}px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${({ theme, $progressState }) => {
        if ($progressState === 'active') {
            return theme.TYPE_ORANGE;
        }
        if ($progressState === 'done') {
            return theme.TYPE_GREEN;
        }

        return theme.TYPE_LIGHT_GREY;
    }};

    &:not(:last-of-type) {
        position: relative;
        margin-right: 8px;
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;

        &:after {
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

        &:before {
            content: '';
            display: block;
            position: absolute;
            top: 0;
            left: 0;
            border-left: 12px solid ${({ theme }) => theme.BG_WHITE};
            border-top: ${({ $currentHeight = DEFAULT_LABEL_HEIGHT }) => $currentHeight / 2}px solid
                transparent;
            border-bottom: ${({ $currentHeight = DEFAULT_LABEL_HEIGHT }) => $currentHeight / 2}px
                solid transparent;
        }
    }
`;

const IconWrapper = styled.div<{ $progressState: ProgressLabelState }>`
    // TODO: Add right bg colors when they're in the design system
    background: ${({ theme, $progressState }) =>
        getProgressStateColor({ theme, $progressState, $isIconWrapper: true })};
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
    background: ${({ theme }) => theme.TYPE_DARK_GREY};
`;

interface ProgressLabelProps {
    children: ReactNode;
    progressState: ProgressLabelState;
}

export const ProgressLabel = ({ children, progressState = 'stale' }: ProgressLabelProps) => {
    const theme = useTheme();

    // Watch height to adjust element's edge shape sizes (triangle, flag tale)
    const ref = useRef<HTMLElement>(null);
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
            return <Image width={20} height={20} image="SPINNER_ORANGE" />;
        }

        if (progressState === 'done') {
            return <Icon icon="CHECK" size={16} color={theme.TYPE_GREEN} />;
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
