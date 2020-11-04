import * as React from 'react';
import styled, { css } from 'styled-components';
import { Icon } from '../../Icon';
import { IconType, ButtonVariant, SuiteThemeColors } from '../../../support/types';
import { variables } from '../../../config';
import { useTheme } from '../../../utils';
import FluidSpinner from '../../loaders/FluidSpinner';

const getPadding = (variant: ButtonVariant) => {
    if (variant === 'tertiary') {
        return '4px 6px';
    }

    return '9px 12px';
};

const getIconColor = (variant: ButtonVariant, isDisabled: boolean, theme: SuiteThemeColors) => {
    if (isDisabled) return theme.TYPE_LIGHT_GREY;

    switch (variant) {
        case 'primary':
        case 'danger':
            return theme.TYPE_WHITE;
        case 'tertiary':
            return theme.TYPE_DARK_GREY;
        case 'secondary':
            return theme.TYPE_GREEN;
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
    border-radius: 4px;
    font-size: ${props => getFontSize(props.variant)};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    outline: none;
    padding: ${props => getPadding(props.variant)};

    ${props =>
        props.variant === 'primary' &&
        css`
            color: ${props => props.theme.TYPE_WHITE};
            font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
            font-size: ${variables.FONT_SIZE.NORMAL};
            background: ${props => props.theme.BG_GREEN};

            &:hover,
            &:focus,
            &:active {
                /* we use this color only for this case  */
                background: ${props => props.theme.BG_GREEN_HOVER};
            }
        `}

    ${props =>
        props.variant === 'secondary' &&
        css`
            background: ${props => props.theme.BG_LIGHT_GREEN};
            font-weight: ${variables.FONT_WEIGHT.MEDIUM};
            color: ${props => props.theme.TYPE_GREEN};

            &:hover,
            &:focus,
            &:active {
                /* we use this color only for this case  */
                background: ${props => props.theme.BG_LIGHT_GREEN_HOVER};
            }
        `}

    ${props =>
        props.variant === 'tertiary' &&
        css`
            color: ${props => props.theme.TYPE_DARK_GREY};
            background: ${props => props.theme.BG_GREY_ALT};

            &:hover,
            &:active,
            &:focus {
                color: ${props => props.theme.TYPE_DARK_GREY};
            }
        `};

    ${props =>
        props.variant === 'tertiary' &&
        props.isWhite &&
        css`
            background: ${props => props.theme.BG_WHITE};
        `};

    ${props =>
        props.variant === 'danger' &&
        css`
            color: ${props => props.theme.TYPE_WHITE};
            font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
            background: ${props => props.theme.BUTTON_RED};

            &:hover,
            &:active,
            &:focus {
                background: ${props => props.theme.BUTTON_RED_HOVER};
            }
        `}

    ${props =>
        props.isDisabled &&
        css`
            background: ${props => props.theme.BG_GREY};
            color: ${props => props.theme.TYPE_LIGHT_GREY};

            &:hover,
            &:active,
            &:focus {
                background: ${props => props.theme.BG_GREY};
                color: ${props => props.theme.TYPE_LIGHT_GREY};
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
    position: relative;
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
    additionalClassName?: string;
    icon?: IconType;
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
            className,
            variant = 'primary',
            icon,
            additionalClassName,
            color,
            fullWidth = false,
            isWhite = false,
            isDisabled = false,
            isLoading = false,
            alignIcon = 'left',
            onChange,
            ...rest
        }: Props,
        ref?: React.Ref<HTMLButtonElement>
    ) => {
        const theme = useTheme();
        const newClassName = additionalClassName
            ? `${className} ${additionalClassName}`
            : className;
        const IconComponent = icon ? (
            <IconWrapper alignIcon={alignIcon} variant={variant} hasLabel={!!children}>
                <Icon
                    icon={icon}
                    size={variant === 'tertiary' ? 12 : 14}
                    color={color || getIconColor(variant, isDisabled, theme)}
                />
            </IconWrapper>
        ) : null;
        const Loader = (
            <IconWrapper alignIcon={alignIcon} hasLabel={!!children}>
                <FluidSpinner size={10} color={color} />
            </IconWrapper>
        );
        return (
            <Wrapper
                className={newClassName}
                variant={variant}
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
    }
);

export { Button, Props as ButtonProps };
