import { ReactNode, useEffect, useRef, useState } from 'react';

import styled, { DefaultTheme } from 'styled-components';

import { IconCircle, Text, Row } from '@trezor/components';
import { borders, spacings, spacingsPx } from '@trezor/theme';
import { IconCirclePaddingType } from '@trezor/components/src/components/IconCircle/types';

import { ProgressLabelState } from './types';

const DEFAULT_LABEL_HEIGHT = 48;

const mapProgressStateToBackground = ({
    theme,
    $progressState,
}: {
    theme: DefaultTheme;
    $progressState: ProgressLabelState;
}) => {
    switch ($progressState) {
        case 'active':
            return theme.backgroundAlertYellowSubtleOnElevation2;
        case 'done':
            return theme.backgroundPrimarySubtleOnElevation1;
        default:
            return theme.backgroundSurfaceElevation2;
    }
};

const getProgressStateIcon = (progressState: ProgressLabelState) => {
    const props = {
        paddingType: 'small' as IconCirclePaddingType,
        size: 18,
        hasBorder: false,
    };

    switch (progressState) {
        case 'active':
            return <IconCircle {...props} name="spinner" variant="warning" />;
        case 'done':
            return <IconCircle {...props} name="check" variant="primary" />;
        default:
            return <IconCircle {...props} name="dotOutlineFilled" variant="tertiary" />;
    }
};

const getProgressStateVariant = (progressState: ProgressLabelState) => {
    switch (progressState) {
        case 'active':
            return 'warning';
        case 'done':
            return 'primary';
        default:
            return 'tertiary';
    }
};

const ProgressLabelItem = styled.div<{
    $progressState: ProgressLabelState;
    $currentHeight?: number;
}>`
    background: ${mapProgressStateToBackground};
    flex: 1 0 220px;
    padding: ${spacingsPx.xs} ${spacingsPx.sm};
    border-radius: ${borders.radii.full};
    min-height: ${DEFAULT_LABEL_HEIGHT}px;

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
            border-left: 12px solid ${mapProgressStateToBackground};
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

interface ProgressLabelProps {
    children: ReactNode;
    progressState: ProgressLabelState;
}

export const ProgressLabel = ({ children, progressState = 'stale' }: ProgressLabelProps) => {
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

    return (
        <ProgressLabelItem ref={ref} $progressState={progressState} $currentHeight={currentHeight}>
            <Row gap={spacings.sm} height="100%">
                {getProgressStateIcon(progressState)}
                <Text
                    as="div"
                    variant={getProgressStateVariant(progressState)}
                    typographyStyle="hint"
                >
                    {children}
                </Text>
            </Row>
        </ProgressLabelItem>
    );
};
