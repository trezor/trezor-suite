import React, { ButtonHTMLAttributes } from 'react';

import styled, { DefaultTheme, useTheme } from 'styled-components';

import { CSSColor, borders, spacingsPx, typography } from '@trezor/theme';

import { UIAlignment } from '../../../config/types';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../../utils/frameProps';
import { TransientProps } from '../../../utils/transientProps';
import { focusStyleTransition, getFocusShadowStyle } from '../../../utils/utils';
import { Icon, IconName, IconSize } from '../../Icon/Icon';
import { Spinner } from '../../loaders/Spinner/Spinner';

export const allowedTextButtonFrameProps = ['margin'] as const satisfies FramePropsKeys[];
export type AllowedTextButtonFrameProps = Pick<
    FrameProps,
    (typeof allowedTextButtonFrameProps)[number]
>;

export const textButtonIconAlignments = ['start', 'end'] as const;
export type TextButtonIconAlignment = Extract<
    UIAlignment,
    (typeof textButtonIconAlignments)[number]
>;

export const textButtonSizes = ['small', 'large'] as const;
export type TextButtonSize = (typeof textButtonSizes)[number];

export const textButtonVariants = [
    'primary',
    'tertiary',
    'info',
    'warning',
    'destructive',
] as const;
export type TextButtonVariant = (typeof textButtonVariants)[number];

const mapTextButtonSizeToIconSize = (size: TextButtonSize): IconSize => {
    const sizeMap: Record<TextButtonSize, IconSize> = {
        small: 16,
        large: 20,
    };

    return sizeMap[size];
};

type GetIconProps = {
    icon?: IconName | React.ReactElement;
    size?: IconSize;
    color?: CSSColor;
};

export const getIcon = ({ icon, size, color }: GetIconProps) => {
    if (!icon) return null;
    if (typeof icon === 'string') {
        return <Icon name={icon as IconName} size={size} color={color} />;
    }

    return icon;
};

const mapVariantToColor: Record<TextButtonVariant, string> = {
    primary: 'textPrimaryDefault',
    tertiary: 'textSubdued',
    info: 'textAlertBlue',
    warning: 'textAlertYellow',
    destructive: 'textAlertRed',
};

const mapVariantToHoverColor: Record<TextButtonVariant, string> = {
    primary: 'textPrimaryPressed',
    tertiary: 'textPrimaryPressed',
    info: 'textPrimaryPressed',
    warning: 'textPrimaryPressed',
    destructive: 'textPrimaryPressed',
};

const mapVariantToIconColor = (
    variant: TextButtonVariant,
    isDisabled: boolean,
    theme: DefaultTheme,
): CSSColor => {
    if (isDisabled) {
        return theme.iconDisabled;
    }

    const colorMap: Record<TextButtonVariant, CSSColor> = {
        primary: theme.iconPrimaryDefault,
        tertiary: theme.iconOnTertiary,
        info: theme.iconAlertBlue,
        warning: theme.iconAlertYellow,
        destructive: theme.iconAlertRed,
    };

    return colorMap[variant];
};

const TextButtonContainer = styled.button<
    TransientProps<AllowedTextButtonFrameProps> & {
        $size: TextButtonSize;
        $iconAlignment: TextButtonIconAlignment;
        $variant: TextButtonVariant;
        $isUnderlined: boolean;
    }
>`
    display: flex;
    align-items: center;
    flex-direction: ${({ $iconAlignment }) => $iconAlignment === 'end' && 'row-reverse'};
    gap: ${spacingsPx.xs};
    height: ${({ $size: size }) => (size === 'small' ? 22 : 26)}px;
    padding: ${spacingsPx.xxs};
    border: 1px solid transparent;
    border-radius: ${borders.radii.xxs};
    background: none;
    color: ${({ theme, $variant }) => theme[mapVariantToColor[$variant] as keyof DefaultTheme]};

    ${({ $size }) => ($size === 'small' ? typography.hint : typography.body)};
    white-space: nowrap;
    transition:
        ${focusStyleTransition},
        color 0.1s ease-out;
    outline: none;
    cursor: pointer;

    ${({ $isUnderlined }) => $isUnderlined && 'text-decoration: underline;'}

    ${getFocusShadowStyle()}
    ${withFrameProps}

    &:hover {
        color: ${({ theme, $variant }) =>
            theme[mapVariantToHoverColor[$variant] as keyof DefaultTheme]};

        path {
            fill: ${({ theme, $variant }) =>
                theme[mapVariantToHoverColor[$variant] as keyof DefaultTheme]};
        }
    }

    &:disabled {
        color: ${({ theme }) => theme.textDisabled};
        cursor: not-allowed;

        path {
            fill: ${({ theme }) => theme.iconDisabled};
        }
    }
`;

type SelectedHTMLButtonProps = Pick<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onClick' | 'onMouseOver' | 'onMouseLeave' | 'type' | 'tabIndex'
>;

export type TextButtonProps = SelectedHTMLButtonProps &
    AllowedTextButtonFrameProps & {
        icon?: IconName;
        iconAlignment?: TextButtonIconAlignment;
        size?: TextButtonSize;
        isDisabled?: boolean;
        isLoading?: boolean;
        variant?: TextButtonVariant;
        children?: React.ReactNode;
        isUnderlined?: boolean;
        className?: string;
        'data-testid'?: string;
        title?: string;
    };

export const TextButton = ({
    icon,
    iconAlignment = 'start',
    size = 'large',
    isDisabled = false,
    isUnderlined = false,
    isLoading = false,
    children,
    onClick,
    variant = 'primary',
    'data-testid': dataTestId,
    className,
    tabIndex,
    type = 'button',
    title,
    onMouseOver,
    onMouseLeave,
    ...rest
}: TextButtonProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedTextButtonFrameProps);
    const theme = useTheme();
    const iconSize = mapTextButtonSizeToIconSize(size);
    const IconComponent = getIcon({
        icon,
        size: iconSize,
        color: mapVariantToIconColor(variant, isDisabled, theme),
    });

    const Loader = <Spinner size={iconSize} />;

    return (
        <TextButtonContainer
            $size={size}
            $iconAlignment={iconAlignment}
            disabled={isDisabled || isLoading}
            $variant={variant}
            $isUnderlined={isUnderlined}
            data-testid={dataTestId}
            onClick={onClick}
            className={className}
            tabIndex={tabIndex}
            type={type}
            onMouseOver={onMouseOver}
            onMouseLeave={onMouseLeave}
            title={title}
            {...frameProps}
        >
            {!isLoading && icon && IconComponent}
            {isLoading && Loader}
            {children}
        </TextButtonContainer>
    );
};
