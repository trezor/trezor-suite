import React, { ReactNode } from 'react';

import styled, { useTheme } from 'styled-components';

import { SpacingValues, borders } from '@trezor/theme';

import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';
import { ExclusiveColorOrVariant } from '../Icon/Icon';
import { mapVariantToColor } from '../Icon/utils';

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
        $color ?? mapVariantToColor(theme, false, $variant)};
    border-radius: ${borders.radii.full};
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

    const backgroundIconColor = color ?? mapVariantToColor(theme, false, variant);
    const iconColor = color ?? mapVariantToColor(theme, false, variant);

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
