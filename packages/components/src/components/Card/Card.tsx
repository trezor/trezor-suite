import { forwardRef, ReactNode } from 'react';
import styled from 'styled-components';
import { borders, boxShadows, spacings } from '@trezor/theme';

const Wrapper = styled.div<{ $elevation: Elevation; $paddingSize: number }>`
    display: flex;
    flex-direction: column;
    padding: ${({ $paddingSize }) => $paddingSize}px;
    background: ${({ theme }) => theme.backgroundSurfaceElevation1};
    border-radius: ${borders.radii.md};
    box-shadow: ${({ $elevation }) => $elevation && boxShadows[`elevation${$elevation}`]};
`;

const getPaddingSize = (withLargePadding?: boolean, noPadding?: boolean) => {
    if (noPadding) return 0;
    if (withLargePadding) return spacings.lg;
    return spacings.sm;
};

type Elevation = 0 | 1 | 3;

export interface CardProps {
    elevation?: Elevation;
    withLargePadding?: boolean;
    noPadding?: boolean;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    children?: ReactNode;
    className?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ elevation = 1, withLargePadding, noPadding, children, ...rest }, ref) => (
        <Wrapper
            ref={ref}
            $elevation={elevation}
            $paddingSize={getPaddingSize(withLargePadding, noPadding)}
            {...rest}
        >
            {children}
        </Wrapper>
    ),
);
