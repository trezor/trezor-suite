import * as React from 'react';
import styled, { css } from 'styled-components';
import { IconType, ButtonVariant, ButtonSize } from '../../../support/types';
import colors from '../../../config/colors';
import { FONT_SIZE } from '../../../config/variables';

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

            &:hover {
                background-image: linear-gradient(${colors.GREENER}, #21c100);
            }
        `}

    ${props =>
        props.variant === 'secondary' &&
        css`
            background-image: linear-gradient(${colors.WHITE}, ${colors.WHITE});
            border: 1px solid ${colors.BLACK70};

            &:hover {
                background-image: linear-gradient(${colors.WHITE}, ${colors.BLACK92});
            }
        `}

    ${props =>
        props.variant === 'tertiary' &&
        css`
            background: ${colors.WHITE};
            border: none;
        `}

    /* set size */
    ${props =>
        props.size === 'small' &&
        css`
            padding: 2px;
        `}

    ${props =>
        props.size === 'medium' &&
        css`
            padding: 8px;
        `}

    ${props =>
        props.size === 'large' &&
        css`
            padding: 10px;
        `}

    ${props =>
        props.disabled &&
        css`
            color: ${colors.BLACK80};
            cursor: default;
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
