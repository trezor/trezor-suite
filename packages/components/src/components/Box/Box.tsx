import styled from 'styled-components';

import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';

export const allowedBoxFrameProps = [
    'margin',
    'padding',
    'width',
    'overflow',
    'minWidth',
    'maxWidth',
    'height',
    'minHeight',
    'maxHeight',
    'flex',
    'position',
    'cursor',
    'zIndex',
    'aspectRatio',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedBoxFrameProps)[number]>;

const Container = styled.div<TransientProps<AllowedFrameProps>>`
    ${withFrameProps}
`;

export type BoxProps = AllowedFrameProps & {
    children: React.ReactNode;
    'data-testid'?: string;
    as?: React.ElementType;
};

export const Box = ({ children, 'data-testid': dataTestId, as = 'div', ...rest }: BoxProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedBoxFrameProps);

    return (
        <Container as={as} data-testid={dataTestId} {...frameProps}>
            {children}
        </Container>
    );
};
