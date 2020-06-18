import * as React from 'react';
import styled, { css } from 'styled-components';
import { Icon } from '../../Icon';
import { IconType, ButtonVariant } from '../../../support/types';
import { colors, variables } from '../../../config';
import FluidSpinner from '../../loaders/FluidSpinner';

const getPadding = (variant: ButtonVariant) => {
    if (variant === 'tertiary') {
        return '4px 6px';
    }

    return '9px 12px';
};

const getIconColor = (variant: ButtonVariant, isDisabled: boolean) => {
    if (isDisabled) return colors.BLACK80;

    switch (variant) {
        case 'primary':
        case 'danger':
            return colors.WHITE;
        case 'tertiary':
            return colors.NEUE_TYPE_DARK_GREY;
        case 'secondary':
            return colors.NEUE_TYPE_GREEN;
        // no default
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
    isDisabled: boolean;
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
    border-radius: 4px;
    font-size: ${props => getFontSize(props.variant)}; 
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => (props.color ? props.color : colors.BLACK25)};
    outline: none;
    padding: ${props => getPadding(props.variant)};

    ${props =>
        props.variant === 'primary' &&
        css`
            color: ${colors.WHITE};
            font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
            font-size: ${variables.FONT_SIZE.NORMAL};
            background: ${colors.NEUE_BG_GREEN};

            &:hover,
            &:focus,
            &:active {
                background: #339714;
            }
        `}

    ${props =>
        props.variant === 'secondary' &&
        css`
            background: ${colors.NEUE_BG_LIGHT_GREEN};
            font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
            color: ${colors.NEUE_TYPE_GREEN};

            &:hover,
            &:focus,
            &:active {
                background: #edf7ea;
            }
        `}

    ${props =>
        props.variant === 'tertiary' &&
        css`
            color: ${colors.NEUE_TYPE_DARK_GREY};
            background: #f8f8f8;

            &:hover,
            &:focus {
                color: ${colors.BLACK25};
            }
            &:active {
                color: ${colors.BLACK25};
            }
        `};

    ${props =>
        props.variant === 'danger' &&
        css`
            color: ${colors.WHITE};
            font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
            background: ${colors.BUTTON_RED};

            &:hover,
            &:focus {
                background: ${colors.BUTTON_RED_HOVER};
            }

            &:active {
                background: ${colors.BUTTON_RED_ACTIVE};
            }
        `}

    ${props =>
        props.isDisabled &&
        css`
            background: ${colors.NEUE_BG_GRAY};
            color: ${colors.NEUE_TYPE_LIGHT_GREY};

            &:hover,
            &:active,
            &:focus {
                background: ${colors.NEUE_BG_GRAY};
                color: ${colors.NEUE_TYPE_LIGHT_GREY};
            }
        `}

    ${props =>
        props.fullWidth &&
        css`
            width: 100%;
        `}
`;

interface IconWrapperProps {
    alignIcon?: Props['alignIcon'];
    variant?: Props['variant'];
}

const IconWrapper = styled.div<IconWrapperProps>`
    position: relative;
    display: flex;

    ${props =>
        props.alignIcon === 'left' &&
        css`
            margin: 0 8px 0 3px;
        `}

    ${props =>
        props.alignIcon === 'right' &&
        css`
            margin: 0 0 0 8px;
        `}
    
    ${props =>
        props.variant === 'tertiary' &&
        props.alignIcon === 'right' &&
        css`
            margin: 0 0 0 3px;
        `}

    ${props =>
        props.variant === 'tertiary' &&
        props.alignIcon === 'left' &&
        css`
            margin: 0 3px 0 0;
        `}
`;

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    additionalClassName?: string;
    icon?: IconType;
    isDisabled?: boolean;
    isLoading?: boolean;
    fullWidth?: boolean;
    alignIcon?: 'left' | 'right';
}

const Button = React.forwardRef(
    (
        {
            children,
            className,
            variant = 'primary',
            icon,
            additionalClassName,
            color,
            fullWidth = false,
            isDisabled = false,
            isLoading = false,
            alignIcon = 'left',
            onChange,
            ...rest
        }: Props,
        ref?: React.Ref<HTMLButtonElement>
    ) => {
        const newClassName = additionalClassName
            ? `${className} ${additionalClassName}`
            : className;
        const IconComponent = icon ? (
            <IconWrapper alignIcon={alignIcon} variant={variant}>
                <Icon icon={icon} size={14} color={color || getIconColor(variant, isDisabled)} />
            </IconWrapper>
        ) : null;
        const Loader = (
            <IconWrapper alignIcon={alignIcon}>
                <FluidSpinner size={10} color={color} />
            </IconWrapper>
        );
        return (
            <Wrapper
                className={newClassName}
                variant={variant}
                onChange={onChange}
                isDisabled={isDisabled}
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
    }
);

export { Button, Props as ButtonProps };
