import * as React from 'react';
import styled, { css } from 'styled-components';
import { Icon } from '../../Icon';
import { IconType, ButtonVariant, ButtonSize } from '../../../support/types';
import colors from '../../../config/colors';
import { FONT_SIZE } from '../../../config/variables';
import FluidSpinner from '../../FluidSpinner';

const getPrimaryPadding = (size: ButtonSize) => {
    switch (size) {
        case 'small':
            return '5px 12px 3px';
        case 'large':
            return '11px 12px 9px';
        default:
            return '9px 12px 7px';
    }
};

const getButtonHeight = (size: ButtonSize) => {
    switch (size) {
        case 'small':
            return '26px';
        case 'large':
            return '38px';
        default:
            return '34px';
    }
};

const getSecondaryPadding = (size: ButtonSize) => {
    switch (size) {
        case 'small':
            return '4px 12px 2px';
        case 'large':
            return '10px 12px 8px';
        default:
            return '8px 12px 6px';
    }
};

const getTertiaryFontSize = (size: ButtonSize) => {
    switch (size) {
        case 'small':
            return FONT_SIZE.TINY;
        case 'large':
            return FONT_SIZE.NORMAL;
        default:
            return FONT_SIZE.SMALL;
    }
};

const getIconColor = (variant: ButtonVariant, isDisabled: boolean) => {
    if (isDisabled) return colors.BLACK80;
    return variant === 'primary' || variant === 'danger' ? colors.WHITE : colors.BLACK25;
};

const Wrapper = styled.button<WrapperProps>`
    display: flex;
    width: ${props => (props.fullWidth ? '100%' : 'auto')};
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 3px;
    font-size: ${FONT_SIZE.BUTTON};
    font-weight: 600;
    color: ${colors.BLACK25};
    outline: none;

    ${props =>
        props.variant === 'primary' &&
        !props.isDisabled &&
        css`
            color: ${colors.WHITE};
            background-image: linear-gradient(to top, ${colors.GREENER}, #21c100);
            border: none;
            padding: ${getPrimaryPadding(props.size)};
            height: ${getButtonHeight(props.size)};
            box-shadow: 0 3px 6px 0 rgba(48, 193, 0, 0.3);

            &:hover,
            &:focus {
                background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.25)),
                    linear-gradient(to top, ${colors.GREENER}, #21c100);
            }
        `}

    ${props =>
        props.variant === 'secondary' &&
        !props.isDisabled &&
        css`
            background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.05)),
                linear-gradient(${colors.WHITE}, ${colors.WHITE});
            border: 1px solid ${colors.BLACK70};
            padding: ${getSecondaryPadding(props.size)};
            height: ${getButtonHeight(props.size)};
            font-weight: 500;

            &:hover,
            &:focus {
                background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.15)),
                    linear-gradient(${colors.WHITE}, ${colors.WHITE});
            }
        `}

    ${props =>
        props.variant === 'tertiary' &&
        !props.isDisabled &&
        css`
            border: none;
            height: 20px;
            font-size: ${getTertiaryFontSize(props.size)};
            padding: 0 4px;
            font-weight: 500;

            &:hover,
            &:focus {
                background: ${colors.BLACK92};
            }
        `}

    ${props =>
        props.variant === 'danger' &&
        !props.isDisabled &&
        css`
            color: ${colors.WHITE};
            background-image: linear-gradient(to top, ${colors.RED}, #f25757);
            border: none;
            padding: ${getPrimaryPadding(props.size)};
            box-shadow: 0 3px 6px 0 rgba(205, 73, 73, 0.3);

            &:hover,
            &:focus {
                background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.25)),
                    linear-gradient(to top, ${colors.RED}, #f25757);
            }
        `}

    ${props =>
        props.isDisabled &&
        props.variant !== 'tertiary' &&
        css`
            color: ${colors.BLACK80};
            cursor: default;
            border: solid 1px ${colors.BLACK70};
            background-image: linear-gradient(${colors.WHITE}, ${colors.BLACK96});
            padding: ${getSecondaryPadding(props.size)};
        `}

    
    ${props =>
        props.isDisabled &&
        props.variant === 'tertiary' &&
        css`
            color: ${colors.BLACK80};
            border: none;
        `}

    ${props =>
        !props.isDisabled &&
        css`
            &:active {
                transform: translateY(1px);
            }
        `}
`;

const IconWrapper = styled.div`
    display: flex;
    margin-right: 8px;
    margin-left: 3px;
    transform: translateY(-1px);
`;

const Label = styled.div`
    line-height: 18px;
`;

interface WrapperProps {
    variant: ButtonVariant;
    size: ButtonSize;
    isDisabled: boolean;
    fullWidth: boolean;
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: IconType;
    isDisabled?: boolean;
    isLoading?: boolean;
    fullWidth?: boolean;
}

const Button = ({
    children,
    variant = 'primary',
    size = 'large',
    icon,
    fullWidth = false,
    isDisabled = false,
    isLoading = false,
    ...rest
}: ButtonProps) => {
    return (
        <Wrapper
            variant={variant}
            size={size}
            isDisabled={isDisabled}
            disabled={isDisabled}
            fullWidth={fullWidth}
            {...rest}
        >
            {!isLoading && icon && (
                <IconWrapper>
                    <Icon icon={icon} size={10} color={getIconColor(variant, isDisabled)} />
                </IconWrapper>
            )}
            {isLoading && (
                <IconWrapper>
                    <FluidSpinner size={10} />
                </IconWrapper>
            )}
            <Label>{children}</Label>
        </Wrapper>
    );
};

export { Button };
