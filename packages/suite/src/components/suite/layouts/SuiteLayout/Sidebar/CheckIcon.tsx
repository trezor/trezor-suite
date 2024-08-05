import React from 'react';
import styled, { useTheme } from 'styled-components';
import { borders, CSSColor } from '@trezor/theme';
import { Icon } from '@trezor/components';

const IconWrapper = styled.div<{ $background: CSSColor }>`
    position: absolute;
    bottom: 50%;
    left: 50%;
    background: ${({ $background }) => $background};
    border-radius: ${borders.radii.full};
`;

type CheckIconProps = {
    isTorContainerHoveredOrFocused?: boolean;
};

export const CheckIcon = ({ isTorContainerHoveredOrFocused = false }: CheckIconProps) => {
    const theme = useTheme();
    const background = isTorContainerHoveredOrFocused
        ? theme.backgroundTertiaryPressedOnElevation0
        : theme.backgroundSurfaceElevationNegative;

    return (
        <IconWrapper $background={background}>
            <Icon icon="CHECK_ACTIVE" size={12} color={theme.iconPrimaryDefault} />
        </IconWrapper>
    );
};
