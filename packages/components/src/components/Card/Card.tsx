import { forwardRef, ReactNode } from 'react';
import styled from 'styled-components';
import { borders, Elevation, mapElevationToBoxShadow, spacings } from '@trezor/theme';

const Wrapper = styled.div<{ $elevation: Elevation; $paddingSize: number }>`
    display: flex;
    flex-direction: column;
    padding: ${({ $paddingSize }) => $paddingSize}px;
    background: ${({ theme }) => theme.backgroundSurfaceElevation1};
    border-radius: ${borders.radii.md};
    box-shadow: ${({ theme, $elevation }) => {
        const boxShadow = mapElevationToBoxShadow[$elevation];

        return boxShadow !== undefined ? theme[boxShadow] : undefined;
    }};
    /* when theme changes from light to dark */
    transition: background 0.3s;
`;

const getPaddingSize = (paddingType?: PaddingType) => {
    switch (paddingType) {
        case 'none':
            return 0;
        case 'large':
            return spacings.lg;
        case 'normal':
        default:
            return spacings.sm;
    }
};

type PaddingType = 'none' | 'normal' | 'large';

export interface CardProps {
    elevation?: Elevation;
    paddingType?: PaddingType;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    children?: ReactNode;
    className?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ elevation = 1, paddingType = 'normal', children, ...rest }, ref) => (
        <Wrapper
            ref={ref}
            $elevation={elevation}
            $paddingSize={getPaddingSize(paddingType)}
            {...rest}
        >
            {children}
        </Wrapper>
    ),
);
