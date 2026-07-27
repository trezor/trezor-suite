import { type ReactNode } from 'react';

import styled from 'styled-components';

import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../../utils/frameProps';
import { type TransientProps } from '../../../utils/transientProps';

export const allowedProgressPieFrameProps = ['margin'] as const satisfies FramePropsKeys[];

type AllowedFrameProps = Pick<FrameProps, (typeof allowedProgressPieFrameProps)[number]>;
type TransientAllowedFrameProps = TransientProps<AllowedFrameProps>;

const Container = styled.div<
    TransientAllowedFrameProps & {
        $valueInPercents: number;
        $size: number;
        $color?: string;
        $backgroundColor?: string;
    }
>`
    display: flex;
    justify-content: center;
    align-items: center;
    width: ${({ $size }) => `${$size}px`};
    height: ${({ $size }) => `${$size}px`};
    border-radius: 50%;
    background: ${({ theme, $valueInPercents, $color, $backgroundColor }) =>
        `conic-gradient(${$color || theme.contentBrand} ${3.6 * $valueInPercents}deg, ${
            $backgroundColor || theme.borderNeutral
        } 0)`};

    ${withFrameProps}
`;

export type ProgressPieProps = AllowedFrameProps & {
    valueInPercents: number; // 0-100
    size?: number;
    color?: string;
    backgroundColor?: string;
    children?: ReactNode;
};

export const ProgressPie = ({
    size = 16,
    children,
    valueInPercents,
    backgroundColor,
    color,
    ...rest
}: ProgressPieProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedProgressPieFrameProps);

    return (
        <Container
            $size={size}
            $valueInPercents={valueInPercents}
            $backgroundColor={backgroundColor}
            $color={color}
            {...frameProps}
        >
            {children}
        </Container>
    );
};
