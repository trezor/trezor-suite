import * as React from 'react';
import styled, { css } from 'styled-components';
import { Icon } from '../../Icon/Icon';
import { IconType, ButtonVariant, SuiteThemeColors } from '../../../support/types';
import { variables } from '../../../config';
import { useTheme } from '../../../utils';
import { FluidSpinner } from '../../loaders/FluidSpinner';
import { darken } from 'polished';

const getPadding = (variant: ButtonVariant, hasLabel: boolean) => {
    if (variant === 'tertiary') {
        return '4px 6px';
    }

    return hasLabel ? '9px 22px' : '8px';
};

const getColor = (variant: ButtonVariant, isDisabled: boolean, theme: SuiteThemeColors) => {
    if (isDisabled) return theme.TYPE_LIGHT_GREY;

    switch (variant) {
        case 'primary':
        case 'danger':
            return theme.TYPE_WHITE;
        case 'tertiary':
            return theme.TYPE_DARK_GREY;
        case 'secondary':
            return theme.TYPE_SECONDARY_TEXT;
        // no default
    }
};

const getIconSize = (variant: ButtonVariant, hasLabel: boolean) => {
    switch (variant) {
        case 'tertiary':
            return 12;
        default:
            return hasLabel ? 14 : 16;
    }
};

const getFontSize = (variant: ButtonVariant) => {
    if (variant === 'tertiary') {
        return variables.FONT_SIZE.TINY;
    }

    return variables.FONT_SIZE.NORMAL;
};

interface WrapperProps {
    variant: ButtonVariant;
    hasLabel: boolean;
    disabled: boolean;
    fullWidth: boolean;
    $color: string | undefined;
}

const Wrapper = styled.button<WrapperProps>`
    display: flex;
    background: transparent;
    align-items: center;
    justify-content: center;
    border: none;
    white-space: nowrap;
    cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};
    border-radius: 8px;
    font-size: ${({ variant }) => getFontSize(variant)};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    outline: none;
    padding: ${({ variant, hasLabel }) => getPadding(variant, hasLabel)};
    transition: ${({ theme }) =>
        `background ${theme.HOVER_TRANSITION_TIME} ${theme.HOVER_TRANSITION_EFFECT}`};
    color: ${({ $color, variant, disabled, theme }) =>
        $color || getColor(variant, disabled, theme)};
    pointer-events: ${({ disabled }) => disabled && 'none'};

    ${({ variant, theme }) =>
        variant === 'primary' &&
        css`
            font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
            background: ${theme.BG_GREEN};

            :hover,
            :focus,
            :active {
                /* we use this color only for this case  */
                background: ${theme.BG_GREEN_HOVER};
            }
        `}

    ${({ variant, theme }) =>
        variant === 'secondary' &&
        css`
            background: ${theme.BG_SECONDARY};

            :hover,
            :focus,
            :active {
                /* we use this color only for this case  */
                background: ${theme.BG_SECONDARY_HOVER};
            }
        `}

    ${({ variant, theme }) =>
        variant === 'tertiary' &&
        css`
            background: ${theme.BG_GREY_ALT};

            :hover,
            :active,
            :focus {
                background: ${darken(theme.HOVER_DARKEN_FILTER, theme.BG_GREY_ALT)};
            }
        `};

    ${({ variant, theme }) =>
        variant === 'danger' &&
        css`
            font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
            background: ${theme.BUTTON_RED};

            :hover,
            :active,
            :focus {
                background: ${theme.BUTTON_RED_HOVER};
            }
        `}

    ${({ disabled, theme }) =>
        disabled &&
        css`
            background: ${theme.BG_GREY};

            :hover,
            :active,
            :focus {
                background: ${theme.BG_GREY};
            }
        `}

    ${({ fullWidth }) =>
        fullWidth &&
        css`
            width: 100%;
        `}
`;

interface IconWrapperProps {
    hasLabel?: boolean;
    alignIcon?: ButtonProps['alignIcon'];
    variant?: ButtonProps['variant'];
}

const IconWrapper = styled.div<IconWrapperProps>`
    display: flex;

    ${({ alignIcon, hasLabel }) =>
        alignIcon === 'left' &&
        hasLabel &&
        css`
            margin: 0 8px 0 3px;
        `}

    ${({ alignIcon, hasLabel }) =>
        alignIcon === 'right' &&
        hasLabel &&
        css`
            margin: 0 0 0 8px;
        `}

    ${({ alignIcon, hasLabel, variant }) =>
        variant === 'tertiary' &&
        hasLabel &&
        alignIcon === 'right' &&
        css`
            margin: 0 0 0 4px;
        `}

    ${({ alignIcon, hasLabel, variant }) =>
        variant === 'tertiary' &&
        hasLabel &&
        alignIcon === 'left' &&
        css`
            margin: 0 4px 0 0;
        `}
`;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    icon?: IconType;
    size?: number;
    isDisabled?: boolean;
    isLoading?: boolean;
    fullWidth?: boolean;
    alignIcon?: 'left' | 'right';
    'data-test'?: string;
}

export const Button = React.forwardRef(
    (
        {
            children,
            variant = 'primary',
            icon,
            size,
            color,
            fullWidth = false,
            isDisabled = false,
            isLoading = false,
            alignIcon = 'left',
            onChange,
            ...rest
        }: ButtonProps,
        ref?: React.Ref<HTMLButtonElement>,
    ) => {
        const theme = useTheme();
        const hasLabel = !!children;
        const IconComponent = icon ? (
            <IconWrapper alignIcon={alignIcon} variant={variant} hasLabel={hasLabel}>
                <Icon
                    icon={icon}
                    size={size || getIconSize(variant, hasLabel)}
                    color={color || getColor(variant, isDisabled, theme)}
                />
            </IconWrapper>
        ) : null;
        const Loader = (
            <IconWrapper alignIcon={alignIcon} variant={variant} hasLabel={hasLabel}>
                <FluidSpinner
                    size={getIconSize(variant, hasLabel) - 1}
                    color={color}
                    strokeWidth={2}
                />
            </IconWrapper>
        );
        return (
            <Wrapper
                variant={variant}
                hasLabel={hasLabel}
                onChange={onChange}
                disabled={isDisabled || isLoading}
                fullWidth={fullWidth}
                $color={color}
                ref={ref}
                {...rest}
            >
                {!isLoading && alignIcon === 'left' && IconComponent}
                {isLoading && alignIcon === 'left' && Loader}
                {children}
                {!isLoading && alignIcon === 'right' && IconComponent}
                {isLoading && alignIcon === 'right' && Loader}
            </Wrapper>
        );
    },
);
