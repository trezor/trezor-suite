import * as React from 'react';
import styled, { css } from 'styled-components';
import { IconType, ButtonVariant, ButtonSize } from '../../../support/types';
import colors from '../../../config/colors';
import { FONT_SIZE } from '../../../config/variables';

const getPrimaryPadding = (size: ButtonSize) => {
    switch (size) {
        case 'small':
            return '5px';
        case 'large':
            return '11px';
        default:
            return '9px';
    }
};

const getSecondaryPadding = (size: ButtonSize) => {
    switch (size) {
        case 'small':
            return '4px';
        case 'large':
            return '10px';
        default:
            return '8px';
    }
};

const Wrapper = styled.button<WrapperProps>`
    display: flex;
    cursor: pointer;
    border-radius: 3px;
    font-size: ${FONT_SIZE.BUTTON};
    font-weight: 600;
    color: ${colors.BLACK25};

    ${props =>
        props.variant === 'primary' &&
        !props.disabled &&
        css`
            color: ${colors.WHITE};
            background-image: linear-gradient(to top, ${colors.GREENER}, #21c100);
            border: none;
            padding: ${getPrimaryPadding(props.size)};

            &:hover {
                background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.5)),
                    linear-gradient(to top, ${colors.GREENER}, #21c100);
            }
        `}

    ${props =>
        props.variant === 'secondary' &&
        !props.disabled &&
        css`
            background-image: linear-gradient(${colors.WHITE}, ${colors.WHITE});
            border: 1px solid ${colors.BLACK70};
            padding: ${getSecondaryPadding(props.size)};

            &:hover {
                background-image: linear-gradient(${colors.WHITE}, ${colors.BLACK92});
            }
        `}

    ${props =>
        props.disabled &&
        css`
            color: ${colors.BLACK80};
            cursor: default;
            border: solid 1px ${colors.BLACK70};
            background-image: linear-gradient(${colors.WHITE}, ${colors.BLACK96});
            padding: ${getSecondaryPadding(props.size)};
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
    ...rest
}: ButtonProps) => {
    return (
        <Wrapper variant={variant} size={size} disabled={disabled} {...rest}>
            {children}
        </Wrapper>
    );
};

export { Button };
