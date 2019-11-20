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

    ${props =>
        props.display === 'block' &&
        css`
            width: 100%;
        `}
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
        props.state === 'error' &&
        css`
            border-color: ${colors.RED};
        `}

    ${props =>
        props.state === 'success' &&
        css`
            border-color: ${colors.GREENER};
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
        !props.state &&
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

type DisplayType = 'block' | 'default' | 'short';

interface WrapperProps {
    dataTest?: string;
    display?: DisplayType;
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    state?: 'success' | 'error';
    variant?: 'small' | 'large';
    display?: DisplayType;
    topLabel?: string;
    bottomText?: string;
    monospace?: boolean;
    dataTest?: string;
}

const Input = ({
    type = 'text',
    state,
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
        <Wrapper data-test={dataTest} display={display}>
            {topLabel && <Label>{topLabel}</Label>}
            <StyledInput
                type={type}
                state={state}
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
