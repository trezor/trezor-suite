import { ReactNode } from 'react';

import styled, { css } from 'styled-components';

import { palette, borders, spacingsPx } from '@trezor/theme';

import { Card } from '../Card/Card';
import { Icon } from '../Icon/Icon';
import { Box } from '../Box/Box';
import { FrameProps } from '../../utils/frameProps';

export type RadioCardProps = {
    isActive: boolean;
    children: ReactNode;
};

const BorderActive = styled.div<{ isActive: boolean }>`
    pointer-events: none;
    position: absolute;
    inset: 0;
    ${({ isActive }) =>
        isActive &&
        css`
            outline: ${borders.widths.large} solid ${({ theme }) => theme.borderSecondary};
            outline-offset: -${borders.widths.large};
        `}
    border-radius: ${borders.radii.md};
`;

const IconWrapper = styled.div`
    border-radius: ${borders.radii.full};
    background-color: ${({ theme }) => theme.borderSecondary};
    padding: ${spacingsPx.xxxs};
`;

export const RadioCard = ({ isActive, children, ...frameProps }: RadioCardProps & FrameProps) => (
    <Box position={{ type: 'relative' }} {...frameProps}>
        {isActive && (
            <Box position={{ type: 'absolute', top: '-1px', right: '-1px' }} zIndex={2}>
                <IconWrapper>
                    <Icon name="check" size="extraSmall" color={palette.lightWhiteAlpha1000} />
                </IconWrapper>
            </Box>
        )}
        <Card paddingType="small" fillType="none">
            {children}
        </Card>
        <BorderActive isActive={isActive} />
    </Box>
);
