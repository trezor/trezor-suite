import { HTMLProps } from 'react';

import { FrameProps, FramePropsKeys, pickAndPrepareFrameProps } from '../../utils/frameProps';
import { Box } from '../Box/Box';

export const allowedGhostContainerFrameProps = [
    'flex',
    'margin',
    'padding',
    'width',
    'height',
    'minWidth',
    'minHeight',
    'maxWidth',
    'maxHeight',
    'overflow',
    'position',
    'display',
    'zIndex',
    'cursor',
    'borderRadius',
] as const satisfies FramePropsKeys[];
type AllowedGhostContainerFrameProps = Pick<
    FrameProps,
    (typeof allowedGhostContainerFrameProps)[number]
>;

type GhostContainerProps = Pick<HTMLProps<HTMLElement>, 'onClick' | 'tabIndex'> &
    AllowedGhostContainerFrameProps & {
        children: React.ReactNode;
        isDisabled?: boolean;
        isActive?: boolean;
        as?: React.ElementType;
        'data-testid'?: string;
    };

export const GhostContainer = ({
    isDisabled,
    isActive,
    onClick,
    children,
    'data-testid': dataTestId,
    tabIndex,
    as = 'button',
    borderRadius = 10,
    ...rest
}: GhostContainerProps) => {
    const frameProps = pickAndPrepareFrameProps(
        { ...rest, borderRadius },
        allowedGhostContainerFrameProps,
        false,
    );

    return (
        <Box
            onClick={isDisabled ? undefined : onClick}
            cursor={isDisabled ? 'default' : 'pointer'}
            backgroundColor={isActive ? 'stateFillElementGhostSelectedAlt' : 'baseFillElementGhost'}
            backgroundColorOnInteraction={
                isActive || isDisabled ? undefined : 'stateFillElementGhostHovered'
            }
            as={as}
            data-testid={dataTestId}
            tabIndex={tabIndex}
            {...frameProps}
        >
            {children}
        </Box>
    );
};

export type { GhostContainerProps };
