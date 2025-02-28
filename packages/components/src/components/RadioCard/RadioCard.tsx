import { ReactNode } from 'react';

import styled, { css } from 'styled-components';

import { Elevation, borders, mapElevationToBorder, palette, spacingsPx } from '@trezor/theme';

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
    background: ${({ theme }) => theme.backgroundSurfaceElevation1};

    ${({ onClick }) => onClick && 'cursor: pointer;'}

    &:hover,
    &:focus {
        outline-color: ${({ theme }) => theme.borderInputDefault};
    }

    ${({ $isActive }) =>
        $isActive &&
        css`
            outline-color: ${({ theme }) => theme.borderSecondary} !important;
        `}

    ${withFrameProps}
`;

const IconWrapper = styled.div`
    border-radius: ${borders.radii.full};
    background: ${({ theme }) => theme.borderSecondary};
    padding: ${spacingsPx.xxxs};
`;

export const RadioCard = ({ isActive, onClick, children, ...rest }: RadioCardProps) => {
    const { elevation } = useElevation();
    const frameProps = pickAndPrepareFrameProps(rest, allowedRadioCardFrameProps);

    return (
        <Wrapper $isActive={isActive} onClick={onClick} $elevation={elevation} {...frameProps}>
            {isActive && (
                <Box position={{ type: 'absolute', top: '-3px', right: '-3px' }}>
                    <IconWrapper>
                        <Icon name="check" size="small" color={palette.lightWhiteAlpha1000} />
                    </IconWrapper>
                </Box>
            )}
            {children}
        </Wrapper>
    );
};
