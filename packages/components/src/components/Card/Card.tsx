import { forwardRef, ReactNode } from 'react';
import { borders, spacings } from '@trezor/theme';
import styled, { css } from 'styled-components';
import { ElevationContext, useElevation } from '../ElevationContext/ElevationContext';
import { Elevation, mapElevationToBackground } from '@trezor/theme/src/elevation';

const Wrapper = styled.div<{ $elevation: Elevation; $paddingSize: number }>`
    display: flex;
    flex-direction: column;
    padding: ${({ $paddingSize }) => $paddingSize}px;
    background: ${({ theme, $elevation }) => theme[mapElevationToBackground[$elevation]]};
    border-radius: ${borders.radii.md};
    box-shadow: ${({ theme, $elevation }) => $elevation === 1 && theme.boxShadowBase};

    ${({ onClick, theme }) =>
        onClick !== undefined
            ? css`
                  :hover {
                      cursor: pointer;

                      box-shadow: ${() => theme.boxShadowElevated};
                  }
              `
            : ''}

    /* when theme changes from light to dark */
    transition: background 0.3s, box-shadow 0.2s;
`;

const getPaddingSize = (paddingType?: PaddingType) => {
    switch (paddingType) {
        case 'small':
            return spacings.sm;
        case 'none':
            return 0;
        case 'normal':
        default:
            return spacings.lg;
    }
};

type PaddingType = 'small' | 'none' | 'normal';

export interface CardProps {
    paddingType?: PaddingType;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onClick?: () => void;

    children?: ReactNode;
    className?: string;

    forceElevation?: Elevation;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ paddingType = 'normal', children, forceElevation, ...rest }, ref) => {
        const { elevation } = useElevation(forceElevation);

        return (
            <Wrapper
                ref={ref}
                $elevation={elevation}
                $paddingSize={getPaddingSize(paddingType)}
                {...rest}
            >
                <ElevationContext baseElevation={elevation}>{children}</ElevationContext>
            </Wrapper>
        );
    },
);
