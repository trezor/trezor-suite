import { ReactNode } from 'react';

import styled, { css } from 'styled-components';

import { borders, palette, spacingsPx } from '@trezor/theme';

import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';
import { Box } from '../Box/Box';
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

const Wrapper = styled.div<{ $isActive: boolean } & TransientProps<AllowedFrameProps>>`
    position: relative;
    width: 100%;
    border-radius: ${borders.radii.md};
    box-shadow: ${({ theme }) => theme.boxShadowBase};
    padding: ${spacingsPx.md};
    outline: ${borders.widths.small} solid ${({ theme }) => theme.borderFocus};
    outline-offset: -${borders.widths.small};

    ${({ onClick }) => onClick && 'cursor: pointer;'}

    &:hover,
    &:focus {
        outline-color: ${({ theme }) => theme.borderInputDefault};
    }

    ${({ $isActive }) =>
        $isActive &&
        css`
            outline-width: ${borders.widths.large};
            outline-color: ${({ theme }) => theme.borderSecondary} !important;
            outline-offset: -${borders.widths.large};
        `}

    ${withFrameProps}
`;

const IconWrapper = styled.div`
    border-radius: ${borders.radii.full};
    background: ${({ theme }) => theme.borderSecondary};
    padding: ${spacingsPx.xxxs};
`;

export const RadioCard = ({ isActive, onClick, children, ...rest }: RadioCardProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedRadioCardFrameProps);

    return (
        <Wrapper $isActive={isActive} onClick={onClick} {...frameProps}>
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
