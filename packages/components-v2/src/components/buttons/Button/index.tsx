import * as React from 'react';
import styled, { css } from 'styled-components';
import { IconType, ButtonVariant, ButtonSize } from '../../../support/types';
import colors from '../../../config/colors';
import { FONT_SIZE } from '../../../config/variables';

const getPrimaryPadding = (size: ButtonSize) => {
    switch (size) {
        case 'small':
            return '2px';
        case 'large':
            return '10px';
        default:
            return '8px';
    }
};

const getSecondaryPadding = (size: ButtonSize) => {
    switch (size) {
        case 'small':
            return '1px';
        case 'large':
            return '9px';
        default:
            return '7px';
    }
};

const getTertiarySize = (size: ButtonSize) => {
    switch (size) {
        case 'small':
            return '12px';
        case 'large':
            return '14px';
        default:
            return '13px';
    }
};

const Wrapper = styled.button<WrapperProps>`
    flex: 1;
    cursor: pointer;
    border-radius: 3px;
    font-size: ${FONT_SIZE.BUTTON};
    font-weight: 600;
    color: ${colors.BLACK25};

    /* set variant */
    ${props =>
        props.variant === 'primary' &&
        css`
            color: ${colors.WHITE};
            background-image: linear-gradient(${colors.GREEN}, ${colors.GREENER});
            border: none;
            padding: ${getPrimaryPadding(props.size)};

            &:hover {
                background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.5)),
                    linear-gradient(${colors.GREEN}, ${colors.GREENER});
            }
        `}

    ${props =>
        props.variant === 'secondary' &&
        css`
            background-image: linear-gradient(${colors.WHITE}, ${colors.WHITE});
            border: 1px solid ${colors.BLACK70};
            padding: ${getSecondaryPadding(props.size)};

            &:hover {
                background-image: linear-gradient(${colors.WHITE}, ${colors.BLACK92});
            }
        `}

    ${props =>
        props.variant === 'tertiary' &&
        css`
            background: ${colors.WHITE};
            border: none;
            padding: ${getTertiarySize(props.size)};
        `}

    ${props =>
        props.disabled &&
        css`
            color: ${colors.BLACK80};
            cursor: default;
            border: solid 1px ${colors.BLACK70};
            background-image: linear-gradient(${colors.WHITE}, ${colors.BLACK96});
        `}
`;

interface WrapperProps {
    variant: ButtonVariant;
    size: ButtonSize;
    disabled: boolean;
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: IconType;
    disabled?: boolean;
}

const Button = ({
    children,
    variant = 'primary',
    size = 'medium',
    icon,
    disabled = false,
}: ButtonProps) => {
    return (
        <Wrapper variant={variant} size={size} disabled={disabled}>
            {children}
        </Wrapper>
    );
};

export { Button };
