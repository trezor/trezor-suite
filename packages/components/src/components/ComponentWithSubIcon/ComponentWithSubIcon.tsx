import type { ReactNode } from 'react';
import React from 'react';

import styled, { useTheme } from 'styled-components';

import type { SpacingValues } from '@trezor/theme';
import { borders } from '@trezor/theme';

import type { FrameProps, FramePropsKeys } from '../../utils/frameProps';
import { pickAndPrepareFrameProps, withFrameProps } from '../../utils/frameProps';
import type { TransientProps } from '../../utils/transientProps';
import type { ExclusiveColorOrVariant } from '../Icon/Icon';
import { getColorForIconVariant } from '../Icon/Icon';

export const allowedComponentWithSubIconFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedComponentWithSubIconFrameProps)[number]>;

const Container = styled.div<TransientProps<AllowedFrameProps>>`
    position: relative;

    ${withFrameProps}
`;

type SubIconWrapperProps = TransientProps<ExclusiveColorOrVariant> & {
    $subIconColor: string;
    $iconOffset: SpacingValues;
    $iconPadding: SpacingValues;
};

const SubIconWrapper = styled.div<SubIconWrapperProps>`
    padding: ${({ $iconPadding }) => `${$iconPadding}px`};

    display: flex;
    justify-content: center;
    align-items: center;

    position: absolute;
    right: -${({ $iconOffset }) => $iconOffset}px;
    top: -${({ $iconOffset }) => $iconOffset}px;

    background-color: ${({ theme, $variant, $color }) =>
        getColorForIconVariant({ theme, variant: $variant, color: $color })};
    border-radius: ${borders.radii.full};
    border: 1px solid ${({ theme }) => theme['borderElevationNegative']};
`;

export type ComponentWithSubIconProps = AllowedFrameProps &
    ExclusiveColorOrVariant & {
        icon?: React.ReactNode;
        children: ReactNode;
        iconPadding?: SpacingValues;
        iconOffset?: SpacingValues;
    };

export const ComponentWithSubIcon = ({
    variant,
    color,
    children,
    iconPadding = 2,
    iconOffset = 4,
    icon,
    ...rest
}: ComponentWithSubIconProps) => {
    const theme = useTheme();
    const frameProps = pickAndPrepareFrameProps(rest, allowedComponentWithSubIconFrameProps);

    if (icon === undefined) {
        return <Container {...frameProps}>{children}</Container>;
    }

    const backgroundIconColor = getColorForIconVariant({
        theme,
        color,
        variant,
    });

    const iconColor = getColorForIconVariant({
        theme,
        color,
        variant,
    });

    return (
        <Container {...frameProps}>
            {children}
            <SubIconWrapper
                $color={backgroundIconColor}
                $subIconColor={iconColor}
                $iconOffset={iconOffset}
                $iconPadding={iconPadding}
            >
                {icon}
            </SubIconWrapper>
        </Container>
    );
};
