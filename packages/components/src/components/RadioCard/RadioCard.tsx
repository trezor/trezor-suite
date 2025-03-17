import { ReactNode } from 'react';

import styled, { css, useTheme } from 'styled-components';

import { Elevation, borders, mapElevationToBorder, spacingsPx } from '@trezor/theme';

import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';
import { Box } from '../Box/Box';
import { useElevation } from '../ElevationContext/ElevationContext';
import { Icon } from '../Icon/Icon';

export const allowedRadioCardFrameProps = [
    'margin',
    'flex',
    'width',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedRadioCardFrameProps)[number]>;

export type RadioCardProps = {
    isActive: boolean;
    children: ReactNode;
    onClick?: () => void;
} & AllowedFrameProps;

const Wrapper = styled.div<
    { $isActive: boolean; $elevation: Elevation } & TransientProps<AllowedFrameProps>
>`
    position: relative;
    width: 100%;
    border-radius: ${borders.radii.md};
    box-shadow: ${({ theme }) => theme.boxShadowBase};
    padding: ${spacingsPx.md};
    outline: ${borders.widths.small} solid ${mapElevationToBorder};
    outline-offset: -${borders.widths.small};
    background: ${({ theme }) => theme.baseFillSurfacePage};
    ${({ onClick }) => onClick && 'cursor: pointer;'}

    &:hover,
    &:focus {
        outline-color: ${({ theme }) => theme.baseContentEmphasis};
    }

    ${({ $isActive }) =>
        $isActive &&
        css`
            outline-color: ${({ theme }) => theme.baseContentBrand} !important;
        `}

    ${withFrameProps}
`;

const IconBackground = styled.div`
    border-radius: ${borders.radii.full};
    background: ${({ theme }) => theme.baseFillSurfacePage};
`;

export const RadioCard = ({ isActive, onClick, children, ...rest }: RadioCardProps) => {
    const { elevation } = useElevation();
    const theme = useTheme();
    const frameProps = pickAndPrepareFrameProps(rest, allowedRadioCardFrameProps);

    return (
        <Wrapper $isActive={isActive} onClick={onClick} $elevation={elevation} {...frameProps}>
            {isActive && (
                <Box position={{ type: 'absolute', top: '-6px', right: '-6px' }}>
                    <IconBackground>
                        <Icon
                            name="checkCircleFilled"
                            size="mediumLarge"
                            color={theme.baseContentBrand}
                        />
                    </IconBackground>
                </Box>
            )}
            {children}
        </Wrapper>
    );
};
