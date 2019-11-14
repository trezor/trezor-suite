import * as React from 'react';
import styled, { css } from 'styled-components';
import colors from '../../../config/colors';
import { FONT_SIZE } from '../../../config/variables';

const getDisplayWidth = (display: InputProps['display']) => {
    switch (display) {
        case 'block':
            return '100%';
        case 'short':
            return '160px';
        default:
            return '480px';
    }
};

const Wrapper = styled.div<WrapperProps>`
    display: inline-flex;
    flex-direction: column;
`;

const StyledInput = styled.input<InputProps>`
    font-family: ${props => (props.monospace ? 'RobotoMono' : 'TTHoves')};
    padding: 0 10px;
    font-size: 14px;
    border-radius: 3px;
    box-shadow: inset 0 3px 6px 0 ${colors.BLACK92};
    border: solid 1px ${colors.BLACK80};
    background-color: ${colors.WHITE};
    outline: none;
    box-sizing: border-box;
    width: ${props => getDisplayWidth(props.display)};
    height: ${props => (props.variant === 'small' ? '26px' : '38px')};

    ${props =>
        props.hasError &&
        css`
            border-color: ${colors.RED};
        `}

    ${props =>
        props.disabled &&
        css`
            background: ${colors.BLACK96};
            box-shadow: none;
            color: ${colors.BLACK50};
            cursor: not-allowed;
        `}

    ${props =>
        !props.disabled &&
        css`
            &:hover,
            &:focus,
            &:active {
                border-color: ${colors.BLACK50};
            }
        `}
`;

const Label = styled.label`
    padding: 10px;
`;

const BottomText = styled.div`
    padding: 10px;
    font-size: 12px;
    color: ${colors.BLACK50};
`;

interface WrapperProps {
    dataTest?: string;
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    hasError?: boolean;
    variant?: 'small' | 'large';
    display?: 'block' | 'default' | 'short';
    topLabel?: string;
    bottomText?: string;
    monospace?: boolean;
    dataTest?: string;
}

const Input = ({
    type = 'text',
    hasError,
    variant = 'large',
    display = 'default',
    topLabel,
    bottomText,
    disabled,
    monospace,
    dataTest,
    ...rest
}: InputProps) => {
    return (
        <Wrapper data-test={dataTest}>
            {topLabel && <Label>{topLabel}</Label>}
            <StyledInput
                type={type}
                hasError={hasError}
                variant={variant}
                disabled={disabled}
                display={display}
                monospace={monospace}
                {...rest}
            />
            {bottomText && <BottomText>{bottomText}</BottomText>}
        </Wrapper>
    );
};

export { Input };
