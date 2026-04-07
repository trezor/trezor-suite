import { type ReactNode } from 'react';

import styled, { css } from 'styled-components';

import { type Elevation, borders, mapElevationToBorder, spacingsPx } from '@trezor/theme';

import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { type TransientProps } from '../../utils/transientProps';
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
    isDisabled?: boolean;
    children: ReactNode;
    onClick?: () => void;
    dataTestId?: string;
} & AllowedFrameProps;

const Wrapper = styled.div<
    {
        $isActive: boolean;
        $isDisabled: boolean;
        $elevation: Elevation;
    } & TransientProps<AllowedFrameProps>
>`
    position: relative;
    width: 100%;
    border-radius: ${borders.radii.md};
    box-shadow: ${({ theme }) => theme.boxShadowBase};
    padding: ${spacingsPx.md};
    outline: ${borders.widths.small} solid ${mapElevationToBorder};
    outline-offset: -${borders.widths.small};
    background: ${({ theme }) => theme.surfaceFillPage};
    ${({ onClick }) => onClick && 'cursor: pointer;'}

    ${({ $isDisabled }) =>
        !$isDisabled &&
        css`
            &:hover,
            &:focus {
                outline-color: ${({ theme }) => theme.contentBrand};
            }
        `}

    ${({ $isActive }) =>
        $isActive &&
        css`
            outline-color: ${({ theme }) => theme.contentBrand} !important;
        `}

    ${({ $isDisabled }) =>
        $isDisabled &&
        css`
            opacity: 0.5;
            cursor: not-allowed;
        `}

    ${withFrameProps}
`;

const IconBackground = styled.div`
    border-radius: ${borders.radii.full};
    background: ${({ theme }) => theme.surfaceFillPage};
`;

export const RadioCard = ({
    isActive,
    isDisabled = false,
    onClick,
    children,
    dataTestId,
    ...rest
}: RadioCardProps) => {
    const { elevation } = useElevation();
    const frameProps = pickAndPrepareFrameProps(rest, allowedRadioCardFrameProps);

    return (
        <Wrapper
            $isActive={isActive}
            $isDisabled={isDisabled}
            onClick={!isDisabled ? onClick : undefined}
            $elevation={elevation}
            {...frameProps}
            data-testid={dataTestId}
        >
            {isActive && (
                <Box position={{ type: 'absolute', top: '-6px', right: '-6px' }}>
                    <IconBackground>
                        <Icon name="checkCircleFilled" size={20} color="contentBrand" />
                    </IconBackground>
                </Box>
            )}
            {children}
        </Wrapper>
    );
};
