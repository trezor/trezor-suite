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
        !props.isDisabled &&
        css`
            color: ${colors.WHITE};
            font-weight: ${variables.FONT_WEIGHT.BOLD};
            background: ${colors.BUTTON_PRIMARY};

            &:hover {
                box-shadow: 0 0 0 4px ${colors.BUTTON_PRIMARY_HOVER_BORDER};
                background: ${colors.BUTTON_PRIMARY_HOVER};
            }

            &:focus {
                box-shadow: 0 0 0 4px ${colors.BUTTON_PRIMARY_FOCUS_BORDER};
                background: ${colors.BUTTON_PRIMARY_FOCUS};
            }
        `}

    ${props =>
        props.variant === 'secondary' &&
        !props.isDisabled &&
        css`
            background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.05)),
                linear-gradient(${colors.WHITE}, ${colors.WHITE});
            border: 1px solid ${colors.BLACK70};

            &:hover,
            &:focus {
                background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.1)),
                    linear-gradient(${colors.WHITE}, ${colors.WHITE});
            }
        `}

    ${props =>
        props.variant === 'tertiary' &&
        !props.isDisabled &&
        css`
            border: none;
            padding: 0px 4px;

            &:hover,
            &:focus {
                background: ${colors.BLACK92};
            }
        `};

    ${props =>
        props.isDisabled &&
        props.variant === 'tertiary' &&
        css`
            color: ${colors.BLACK80};
            border: none;
        `}

    ${props =>
        props.variant === 'danger' &&
        !props.isDisabled &&
        css`
            color: ${colors.WHITE};
            font-weight: ${variables.FONT_WEIGHT.BOLD};
            background-image: linear-gradient(to top, ${colors.RED}, #f25757);
            box-shadow: 0 3px 6px 0 rgba(205, 73, 73, 0.3);

            &:hover,
            &:focus {
                background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.2)),
                    linear-gradient(to top, ${colors.RED}, #f25757);
            }
        `}

    ${props =>
        props.isDisabled &&
        props.variant !== 'tertiary' &&
        css`
            color: ${colors.BLACK80};
            border: solid 1px ${colors.BLACK70};
            background-image: linear-gradient(${colors.WHITE}, ${colors.BLACK96});
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
