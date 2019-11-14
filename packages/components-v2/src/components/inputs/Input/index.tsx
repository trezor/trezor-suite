import * as React from 'react';
import styled, { css } from 'styled-components';
import colors from '../../../config/colors';
import { FONT_SIZE } from '../../../config/variables';

const Wrapper = styled.div``;

const StyledInput = styled.input<InputProps>`
    height: ${props => props.variant === 'small' ? '26px' : '38px'};
    font-family: RobotoMono;

    ${props => props.hasError && css`
        border-color: ${colors.RED};
    `}
`;

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    hasError?: boolean;
    variant?: 'small' | 'large';
};

const Input = ({ type = 'text', hasError, variant = 'large' }: InputProps) => {
    return (
        <Wrapper>
            <StyledInput type={type} hasError={hasError} variant={variant} />
        </Wrapper>
    );
};

export { Input };
