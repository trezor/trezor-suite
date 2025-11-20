import React, { ReactNode } from 'react';

import styled, { DefaultTheme } from 'styled-components';

import { CSSColor, SpacingValues, borders } from '@trezor/theme';

import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';
import { ButtonIntent } from '../buttons/types';

export const allowedComponentWithSubIconFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedComponentWithSubIconFrameProps)[number]>;

export const mapPropsToBackgroundColor = ({
    $intent,
    theme,
}: {
    $intent: ButtonIntent;
    theme: DefaultTheme;
}): CSSColor => {
    const colorMap: Record<ButtonIntent, CSSColor> = {
        brand: theme.baseFillElementBrandBold,
        neutral: theme.baseFillElementContrast,
        info: theme.baseFillElementInfoBold,
        warning: theme.baseFillElementWarningBold,
        critical: theme.baseFillElementNegativeBold,
    };

    return colorMap[$intent];
};

export const mapPropsToIconColor = ({
    $intent,
    theme,
}: {
    $intent: ButtonIntent;
    theme: DefaultTheme;
}): CSSColor => {
    const colorMap: Record<ButtonIntent, CSSColor> = {
        brand: theme.baseContentOnActionBrandPrimary,
        neutral: theme.baseContentReversePrimary,
        info: theme.baseContentOnActionInfoPrimary,
        warning: theme.baseContentOnActionWarningPrimary,
        critical: theme.baseContentOnActionNegativePrimary,
    };

    return colorMap[$intent];
};

const Container = styled.div<TransientProps<AllowedFrameProps>>`
    position: relative;

    ${withFrameProps}
`;

type SubIconWrapperProps = {
    $iconOffset: SpacingValues;
    $iconPadding: SpacingValues;
    $intent: ButtonIntent;
};

const SubIconWrapper = styled.div<SubIconWrapperProps>`
    padding: ${({ $iconPadding }) => `${$iconPadding}px`};

    display: flex;
    justify-content: center;
    align-items: center;

    background: ${mapPropsToBackgroundColor};
    color: ${mapPropsToIconColor};

    position: absolute;
    right: -${({ $iconOffset }) => $iconOffset}px;
    top: -${({ $iconOffset }) => $iconOffset}px;

    border-radius: ${borders.radii.full};
`;

export type ComponentWithSubIconProps = AllowedFrameProps & {
    icon?: React.ReactNode;
    children: ReactNode;
    iconPadding?: SpacingValues;
    iconOffset?: SpacingValues;
    intent?: ButtonIntent;
};

export const ComponentWithSubIcon = ({
    intent = 'brand',
    children,
    iconPadding = 2,
    iconOffset = 4,
    icon,
    ...rest
}: ComponentWithSubIconProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedComponentWithSubIconFrameProps);

    if (icon === undefined) {
        return <Container {...frameProps}>{children}</Container>;
    }

    return (
        <Container {...frameProps}>
            {children}
            <SubIconWrapper $iconOffset={iconOffset} $iconPadding={iconPadding} $intent={intent}>
                {icon}
            </SubIconWrapper>
        </Container>
    );
};
