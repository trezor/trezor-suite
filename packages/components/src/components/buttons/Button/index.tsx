import * as React from 'react';
import styled, { css } from 'styled-components';
import { Icon } from '../../Icon';
import { IconType, ButtonVariant, SuiteThemeColors } from '../../../support/types';
import { variables } from '../../../config';
import { useTheme } from '../../../utils';
import { FluidSpinner } from '../../loaders/FluidSpinner';
import { darken } from 'polished';

const getPadding = (variant: ButtonVariant, hasLabel: boolean) => {
    if (variant === 'tertiary') {
        return '4px 6px';
    }

    return hasLabel ? '9px 12px' : '8px';
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
    isDisabled: boolean;
    disabled: boolean;
    isWhite: boolean;
    fullWidth: boolean;
    color: string | undefined;
}

const Wrapper = styled.button<WrapperProps>`
    display: flex;
    background: transparent;
    align-items: center;
    justify-content: center;
    border: none;
    white-space: nowrap;
    cursor: ${props => (props.isDisabled ? 'default' : 'pointer')};
    border-radius: 8px;
    font-size: ${props => getFontSize(props.variant)};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    outline: none;
    padding: ${props => getPadding(props.variant, props.hasLabel)};
    transition: ${props =>
        `background ${props.theme.HOVER_TRANSITION_TIME} ${props.theme.HOVER_TRANSITION_EFFECT}`};
    color: ${({ variant, isDisabled, theme }) => getColor(variant, isDisabled, theme)};
    pointer-events: ${({ disabled }) => disabled && 'none'};

    ${props =>
        props.variant === 'primary' &&
        css`
            font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
            background: ${({ theme }) => theme.BG_GREEN};

            &:hover,
            &:focus,
            &:active {
                /* we use this color only for this case  */
                background: ${({ theme }) => theme.BG_GREEN_HOVER};
            }
        `}

    ${props =>
        props.variant === 'secondary' &&
        css`
            background: ${({ theme }) => theme.BG_SECONDARY};

            &:hover,
            &:focus,
            &:active {
                /* we use this color only for this case  */
                background: ${({ theme }) => theme.BG_SECONDARY_HOVER};
            }
        `}

    ${props =>
        props.variant === 'tertiary' &&
        css`
            background: ${({ theme }) => theme.BG_GREY_ALT};

            :hover,
            :active,
            :focus {
                background: ${({ theme }) => darken(theme.HOVER_DARKEN_FILTER, theme.BG_GREY_ALT)};
            }
        `};

    ${props =>
        props.variant === 'tertiary' &&
        props.isWhite &&
        css`
            background: ${({ theme }) => theme.BG_WHITE};
        `};

    ${props =>
        props.variant === 'danger' &&
        css`
            font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
            background: ${({ theme }) => theme.BUTTON_RED};

            :hover,
            :active,
            :focus {
                background: ${({ theme }) => theme.BUTTON_RED_HOVER};
            }
        `}

    ${props =>
        props.isDisabled &&
        css`
            background: ${({ theme }) => theme.BG_GREY};

            :hover,
            :active,
            :focus {
                background: ${({ theme }) => theme.BG_GREY};
            }
        `}

    ${props =>
        props.fullWidth &&
        css`
            width: 100%;
        `}
`;

interface IconWrapperProps {
    hasLabel?: boolean;
    alignIcon?: Props['alignIcon'];
    variant?: Props['variant'];
}

const IconWrapper = styled.div<IconWrapperProps>`
    display: flex;

    ${props =>
        props.alignIcon === 'left' &&
        props.hasLabel &&
        css`
            margin: 0 8px 0 3px;
        `}

    ${props =>
        props.alignIcon === 'right' &&
        props.hasLabel &&
        css`
            margin: 0 0 0 8px;
        `}

    ${props =>
        props.variant === 'tertiary' &&
        props.hasLabel &&
        props.alignIcon === 'right' &&
        css`
            margin: 0 0 0 4px;
        `}

    ${props =>
        props.variant === 'tertiary' &&
        props.hasLabel &&
        props.alignIcon === 'left' &&
        css`
            margin: 0 4px 0 0;
        `}
`;

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    icon?: IconType;
    size?: number;
    isDisabled?: boolean;
    isLoading?: boolean;
    isWhite?: boolean;
    fullWidth?: boolean;
    alignIcon?: 'left' | 'right';
    'data-test'?: string;
}

const Button = React.forwardRef(
    (
        {
            children,
            variant = 'primary',
            icon,
            size,
            color,
            fullWidth = false,
            isWhite = false,
            isDisabled = false,
            isLoading = false,
            alignIcon = 'left',
            onChange,
            ...rest
        }: Props,
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
            <IconWrapper alignIcon={alignIcon} hasLabel={hasLabel}>
                <FluidSpinner size={10} color={color} />
            </IconWrapper>
        );
        return (
            <Wrapper
                variant={variant}
                hasLabel={hasLabel}
                onChange={onChange}
                isDisabled={isDisabled}
                isWhite={isWhite}
                disabled={isDisabled || isLoading}
                fullWidth={fullWidth}
                color={color}
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

export type { Props as ButtonProps };
export { Button };
