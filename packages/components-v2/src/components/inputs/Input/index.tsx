import * as React from 'react';
import styled, { css } from 'styled-components';
import FluidSpinner from '../../FluidSpinner';
import { Icon } from '../../Icon';
import colors from '../../../config/colors';
import {
    InputState,
    InputVariant,
    InputDisplay,
    InputButton,
    TextAlign,
} from '../../../support/types';

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
    padding: ${props => (props.monospace ? '0 10px 2px' : '0 10px')};
    font-size: ${props => (props.value ? '16px' : '14px')};
    border-radius: 3px;
    box-shadow: inset 0 3px 6px 0 ${colors.BLACK92};
    border: solid 1px ${colors.BLACK80};
    background-color: ${colors.WHITE};
    outline: none;
    box-sizing: border-box;
    width: ${props => getDisplayWidth(props.display)};
    height: ${props => (props.variant === 'small' ? '38px' : '48px')};
    text-align: ${props => props.align || 'left'};

    &:read-only  {
        background: ${colors.BLACK96};
        box-shadow: none;
        color: ${colors.BLACK50};
    }

    ${props =>
        props.state === 'error' &&
        css`
            border-color: ${colors.RED};
            color: ${colors.RED};
        `}

    ${props =>
        props.state === 'success' &&
        css`
            border-color: ${colors.GREENER};
            color: ${colors.GREENER};
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
        !props.readOnly &&
        css`
            &:hover,
            &:focus,
            &:active {
                border-color: ${colors.BLACK50};
            }
        `}
`;

const InputWrapper = styled.div`
    display: flex;
    position: relative;
`;

const InputIconWrapper = styled.div`
    position: absolute;
    top: 1px;
    bottom: 1px;
    right: 10px;
    display: flex;
    align-items: center;
`;

const SpinnerWrapper = styled.div``;

const Label = styled.label`
    padding: 10px;
`;

const BottomText = styled.div<InputProps>`
    padding: 10px;
    font-size: 12px;
    color: ${props =>
        props.state ? (props.state === 'success' ? colors.GREENER : colors.RED) : colors.BLACK50};
`;

const Button = styled.button`
    color: ${colors.BLACK25};
    border: none;
    outline: none;
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 0 0 0 5px;
    background: ${colors.WHITE};

    &:hover {
        color: ${colors.BLACK0};
    }
`;

const ButtonText = styled.div`
    font-size: 14px;
    font-weight: 500;
    height: 14px;
`;

const StyledIcon = styled(Icon)`
    margin-right: 5px;
`;

const StateIconWrapper = styled.div`
    display: flex;
    padding: 0 5px;
    background: ${colors.WHITE};
`;

interface WrapperProps {
    dataTest?: string;
    display?: InputDisplay;
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    state?: InputState;
    variant?: InputVariant;
    display?: InputDisplay;
    inputButton?: InputButton;
    topLabel?: string;
    bottomText?: string;
    monospace?: boolean;
    dataTest?: string;
    wrapperProps?: Record<string, any>;
    isLoading?: boolean;
    sideAddons?: React.ReactNode;
    align?: TextAlign;
}

const Input = ({
    type = 'text',
    state,
    variant = 'large',
    display = 'default',
    inputButton,
    topLabel,
    bottomText,
    disabled,
    monospace,
    dataTest,
    wrapperProps,
    isLoading,
    sideAddons,
    align,
    ...rest
}: InputProps) => {
    const [buttonHover, setButtonHover] = React.useState(false);
    const handleButtonEnter = () => {
        setButtonHover(true);
    };
    const handleButtonLeave = () => {
        setButtonHover(false);
    };

    return (
        <Wrapper data-test={dataTest} display={display} {...wrapperProps}>
            {topLabel && <Label>{topLabel}</Label>}
            <InputWrapper>
                <InputIconWrapper>
                    {isLoading && (
                        <SpinnerWrapper>
                            <FluidSpinner size={16} color={colors.GREEN} />
                        </SpinnerWrapper>
                    )}
                    {inputButton && (
                        <Button
                            onClick={inputButton.onClick}
                            onMouseEnter={handleButtonEnter}
                            onMouseLeave={handleButtonLeave}
                        >
                            {inputButton.icon && (
                                <StyledIcon
                                    icon={inputButton.icon}
                                    size={10}
                                    color={buttonHover ? colors.BLACK0 : colors.BLACK50}
                                />
                            )}
                            {inputButton.text && <ButtonText>{inputButton.text}</ButtonText>}
                        </Button>
                    )}
                    {state && (
                        <StateIconWrapper>
                            <Icon
                                icon={state === 'success' ? 'CHECK' : 'CROSS'}
                                color={state === 'success' ? colors.GREENER : colors.RED}
                                size={10}
                            />
                        </StateIconWrapper>
                    )}
                </InputIconWrapper>
                <StyledInput
                    type={type}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    state={state}
                    variant={variant}
                    disabled={disabled}
                    display={display}
                    monospace={monospace}
                    align={align}
                    {...rest}
                />
                {sideAddons}
            </InputWrapper>
            {bottomText && <BottomText state={state}>{bottomText}</BottomText>}
        </Wrapper>
    );
};

export { Input };
