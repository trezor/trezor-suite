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
] as const satisfies FramePropsKeys[];
type AllowedGhostContainerFrameProps = Pick<
    FrameProps,
    (typeof allowedGhostContainerFrameProps)[number]
>;

type GhostContainerProps = AllowedGhostContainerFrameProps & {
    onClick: (e: React.MouseEvent<HTMLElement>) => void;
    children: React.ReactNode;
    isDisabled?: boolean;
    isActive?: boolean;
    'data-testid'?: string;
    tabIndex?: number;
};

export const GhostContainer = ({
    isDisabled,
    isActive,
    onClick,
    children,
    'data-testid': dataTestId,
    tabIndex,
    ...rest
}: GhostContainerProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedGhostContainerFrameProps, false);

    return (
        <Box
            onClick={isDisabled ? undefined : onClick}
            cursor={isDisabled ? 'default' : 'pointer'}
            backgroundColor={isActive ? 'stateFillElementGhostSelectedAlt' : 'baseFillElementGhost'}
            backgroundColorOnInteraction={
                isActive || isDisabled ? undefined : 'stateFillElementGhostHovered'
            }
            borderRadius={10}
            as="button"
            data-testid={dataTestId}
            tabIndex={tabIndex}
            {...frameProps}
        >
            {children}
        </Box>
    );
};

export type { GhostContainerProps };
