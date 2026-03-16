import { type HTMLProps } from 'react';

import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
} from '../../utils/frameProps';
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

type GhostContainerProps = AllowedGhostContainerFrameProps &
    Pick<HTMLProps<HTMLElement>, 'onClick' | 'tabIndex'> & {
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
    cursor,
    ...rest
}: GhostContainerProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedGhostContainerFrameProps, false);

    return (
        <Box
            onClick={isDisabled ? undefined : onClick}
            backgroundColor={isActive ? 'stateFillElementGhostSelectedAlt' : 'baseFillElementGhost'}
            backgroundColorOnInteraction={
                isActive || isDisabled ? undefined : 'stateFillElementGhostHovered'
            }
            as={as}
            data-testid={dataTestId}
            tabIndex={tabIndex}
            {...frameProps}
            borderRadius={borderRadius}
            cursor={cursor ?? (isDisabled ? 'default' : 'pointer')}
        >
            {children}
        </Box>
    );
};

export type { GhostContainerProps };
