import React from 'react';
import styled, { css, DefaultTheme, useTheme } from 'styled-components';
import { borders, Color, CSSColor, spacings, spacingsPx, typography } from '@trezor/theme';
import { focusStyleTransition, getFocusShadowStyle } from '../../utils/utils';
import type { UISize, UIVariant } from '../../config/types';
import { FrameProps, FramePropsKeys, withFrameProps } from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';
import { Icon, IconName } from '../Icon/Icon';

export const allowedBadgeFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedBadgeFrameProps)[number]>;

export type BadgeSize = Extract<UISize, 'tiny' | 'small' | 'medium'>;
type BadgeVariant = Extract<UIVariant, 'primary' | 'tertiary' | 'destructive'>;

export type BadgeProps = AllowedFrameProps & {
    size?: BadgeSize;
    variant?: BadgeVariant;
    onElevation?: boolean;
    isDisabled?: boolean;
    icon?: IconName;
    hasAlert?: boolean;
    className?: string;
    children?: React.ReactNode;
    inline?: boolean;
};

type MapArgs = {
    $variant: BadgeVariant;
    $onElevation?: boolean;
    theme: DefaultTheme;
};

type BadgeContainerProps = {
    $size: BadgeSize;
    $variant: BadgeVariant;
    $hasAlert: boolean;
    $inline: boolean;
    $onElevation: boolean;
} & TransientProps<AllowedFrameProps>;

const mapVariantToBackgroundColor = ({ $variant, $onElevation, theme }: MapArgs): CSSColor => {
    const colorMap: Record<BadgeVariant, Color> = {
        primary: 'backgroundPrimarySubtleOnElevation0',
        tertiary: `backgroundNeutralSubtleOnElevation${$onElevation ? 1 : 0}`,
        destructive: 'backgroundAlertRedSubtleOnElevation0',
    };

    return theme[colorMap[$variant]];
};

const mapVariantToTextColor = ({ $variant, theme }: MapArgs): CSSColor => {
    const colorMap: Record<BadgeVariant, Color> = {
        primary: 'textPrimaryDefault',
        tertiary: 'textSubdued',
        destructive: 'textAlertRed',
    };

    return theme[colorMap[$variant]];
};

const mapVariantToIconColor = ({ $variant, theme }: MapArgs): CSSColor => {
    const colorMap: Record<BadgeVariant, Color> = {
        primary: 'iconPrimaryDefault',
        tertiary: 'iconSubdued',
        destructive: 'iconAlertRed',
    };

    return theme[colorMap[$variant]];
};

const mapVariantToPadding = ({ $size }: { $size: BadgeSize }): string => {
    const colorMap: Record<BadgeSize, string> = {
        tiny: `0 ${spacings.xs - spacings.xxxs}px`,
        small: `0 ${spacingsPx.xs}`,
        medium: `${spacingsPx.xxxs} ${spacingsPx.xs}`,
    };

    return colorMap[$size];
};

const Container = styled.div<BadgeContainerProps>`
    ${withFrameProps}

    display: ${({ $inline }) => ($inline ? 'inline-flex' : 'flex')};
    align-items: center;
    gap: ${spacingsPx.xxs};
    padding: ${mapVariantToPadding};
    border-radius: ${borders.radii.full};
    border: 1px solid transparent;
    background: ${mapVariantToBackgroundColor};
    transition: ${focusStyleTransition};

    &:disabled {
        background: ${({ theme }) => theme.backgroundNeutralSubtleOnElevation0};
    }

    ${getFocusShadowStyle()}

    ${({ theme, $hasAlert }) =>
        $hasAlert &&
        css`
            &:not(:focus-visible) {
                border: 1px solid ${theme.borderAlertRed};
                box-shadow: 0 0 0 1px ${theme.borderAlertRed};
            }
        `}
`;

const Content = styled.span<{ $isDisabled: boolean; $variant: BadgeVariant; $size: BadgeSize }>`
    color: ${({ $isDisabled, theme }) =>
        $isDisabled ? theme.textDisabled : mapVariantToTextColor};
    ${({ $size }) => ($size === 'medium' ? typography.hint : typography.label)};
`;

export const Badge = ({
    size = 'medium',
    variant = 'tertiary',
    onElevation,
    isDisabled,
    icon,
    hasAlert,
    className,
    children,
    inline,
    margin,
}: BadgeProps) => {
    const theme = useTheme();

    return (
        <Container
            $size={size}
            $variant={variant}
            $hasAlert={!!hasAlert}
            $onElevation={!!onElevation}
            className={className}
            $margin={margin}
            $inline={inline === true}
        >
            {icon && (
                <Icon
                    name={icon}
                    color={
                        isDisabled
                            ? 'iconDisabled'
                            : mapVariantToIconColor({ $variant: variant, theme })
                    }
                />
            )}

            <Content $size={size} $variant={variant} $isDisabled={!!isDisabled}>
                {children}
            </Content>
        </Container>
    );
};
