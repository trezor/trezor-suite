import * as React from 'react';
import styled, { css } from 'styled-components';
import { Icon } from '../../Icon';
import { IconType, ButtonVariant, ButtonSize } from '../../../support/types';
import { colors, variables } from '../../../config';
import FluidSpinner from '../../loaders/FluidSpinner';

const BUTTON_PADDING = {
    small: '2px 12px',
    large: '9px 12px',
};

const getIconColor = (variant: ButtonVariant, isDisabled: boolean) => {
    if (isDisabled) return colors.BLACK80;
    return variant === 'primary' || variant === 'danger' ? colors.WHITE : colors.BLACK25;
};

const getFontSize = (variant: ButtonVariant, size: ButtonSize) => {
    // all button variants use same font size except the small tertiary btn
    if (variant === 'tertiary' && size === 'small') {
        return variables.FONT_SIZE.TINY;
    }
    return variables.FONT_SIZE.BUTTON;
};

const Wrapper = styled.button<WrapperProps>`
    display: flex;
    background: transparent;
    align-items: center;
    justify-content: center;
    border: none;
    white-space: nowrap;
    cursor: ${props => (props.isDisabled ? 'default' : 'pointer')};
    border-radius: 4px;
    font-size: ${props => getFontSize(props.variant, props.size)}; 
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => (props.color ? props.color : colors.BLACK25)};
    outline: none;
    padding: ${props => (props.variant === 'tertiary' ? '0px 4px' : BUTTON_PADDING[props.size])};
    height: ${props => (props.variant === 'tertiary' ? '20px' : 'auto')};

    ${props =>
        props.fullWidth &&
        css`
            width: 100%;
        `}

    ${props =>
        props.variant === 'primary' &&
        css`
            color: ${colors.WHITE};
            font-weight: ${variables.FONT_WEIGHT.BOLD};
            background: ${colors.BUTTON_PRIMARY};

            &:hover {
                box-shadow: 0 0 0 4px ${colors.BUTTON_PRIMARY_BORDER};
                background: ${colors.BUTTON_PRIMARY_HOVER};
            }

            &:focus {
                box-shadow: 0 0 0 4px ${colors.BUTTON_PRIMARY_BORDER};
                background: ${colors.BUTTON_PRIMARY_FOCUS};
            }
        `}

    ${props =>
        props.variant === 'secondary' &&
        css`
            background: ${colors.BUTTON_SECONDARY};

            &:hover {
                box-shadow: 0 0 0 4px ${colors.BUTTON_SECONDARY_BORDER};
                background: ${colors.BUTTON_SECONDARY_HOVER};
            }

            &:focus {
                box-shadow: 0 0 0 4px ${colors.BUTTON_SECONDARY_BORDER};
                background: ${colors.BUTTON_SECONDARY_FOCUS};
            }
        `}

    ${props =>
        props.variant === 'tertiary' &&
        !props.isDisabled &&
        css`
            padding: 0px 4px;
            &:focus,
            &:hover {
                color: ${colors.BLACK25};
                background: ${colors.BUTTON_TERTIARY_HOVER};
            }
        `};

    ${props =>
        props.variant === 'danger' &&
        css`
            color: ${colors.WHITE};
            font-weight: ${variables.FONT_WEIGHT.BOLD};
            background: ${colors.BUTTON_RED};

            &:hover {
                background: ${colors.BUTTON_RED_HOVER};
                box-shadow: 0 0 0 4px ${colors.BUTTON_RED_BORDER};
            }

            &:focus {
                box-shadow: 0 0 0 4px ${colors.BUTTON_RED_BORDER};
                background: ${colors.BUTTON_RED_FOCUS};
            }
        `}

    ${props =>
        props.isDisabled &&
        css`
            background: ${colors.BUTTON_DISABLED_BACKGROUND};
            color: ${colors.BUTTON_DISABLED_TEXT};

            &:hover,
            &:focus {
                box-shadow: none;
                background: ${colors.BUTTON_DISABLED_BACKGROUND};
                color: ${colors.BUTTON_DISABLED_TEXT};
            }
        `}

    ${props =>
        props.isDisabled &&
        props.variant === 'tertiary' &&
        css`
            border: none;
            background: transparent;

            &:hover,
            &:focus {
                box-shadow: none;
                background: transparent;
            }
        `}
`;

const IconWrapper = styled.div<IconWrapperProps>`
    display: flex;

    ${props =>
        props.alignIcon === 'left' &&
        css`
            margin-right: 8px;
            margin-left: 3px;
        `}

    ${props =>
        props.alignIcon === 'right' &&
        css`
            margin-left: 8px;
        `}
`;

interface IconWrapperProps {
    alignIcon?: Props['alignIcon'];
}

interface WrapperProps {
    variant: ButtonVariant;
    size: ButtonSize;
    isDisabled: boolean;
    fullWidth: boolean;
    color: string | undefined;
}

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    additionalClassName?: string;
    icon?: IconType;
    isDisabled?: boolean;
    isLoading?: boolean;
    fullWidth?: boolean;
    alignIcon?: 'left' | 'right';
}

const Button = ({
    children,
    className,
    variant = 'primary',
    size = 'large',
    icon,
    additionalClassName,
    color,
    fullWidth = false,
    isDisabled = false,
    isLoading = false,
    alignIcon = 'left',
    onChange,
    ...rest
}: Props) => {
    const newClassName = additionalClassName ? `${className} ${additionalClassName}` : className;
    const IconComponent = icon ? (
        <IconWrapper alignIcon={alignIcon}>
            <Icon
                icon={icon}
                size={size === 'large' ? 10 : 8}
                color={color || getIconColor(variant, isDisabled)}
            />
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
            size={size}
            onChange={onChange}
            isDisabled={isDisabled}
            disabled={isDisabled || isLoading}
            fullWidth={fullWidth}
            color={color}
            {...rest}
        >
            {!isLoading && alignIcon === 'left' && IconComponent}
            {isLoading && alignIcon === 'left' && Loader}
            {children}
            {!isLoading && alignIcon === 'right' && IconComponent}
            {isLoading && alignIcon === 'right' && Loader}
        </Wrapper>
    );
};

export { Button, Props as ButtonProps };
