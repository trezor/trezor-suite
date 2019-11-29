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

const getStateColor = (state: InputState | undefined) => {
    switch (state) {
        case 'success':
            return colors.GREENER;
        case 'warning':
            return colors.YELLOWER;
        case 'error':
            return colors.RED;
        default:
            return colors.BLACK50;
    }
};

const getStateIcon = (state: InputState) => {
    switch (state) {
        case 'warning':
            return 'INFO';
        case 'error':
            return 'CROSS';
        default:
            return 'CHECK';
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
    border-color: ${props => getStateColor(props.state)};
    color: ${props => getStateColor(props.state)};

    &:read-only {
        background: ${colors.BLACK96};
        box-shadow: none;
        color: ${colors.BLACK50};
    }

    ${props =>
        props.monospace &&
        css`
            padding-bottom: 2px;
        `}

    ${props =>
        props.state &&
        css`
            padding-right: 30px;
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
    z-index: 2;
`;

const SpinnerWrapper = styled.div``;

const Label = styled.label`
    padding: 10px;
`;

const BottomText = styled.div<InputProps>`
    padding: 10px;
    font-size: 12px;
    color: ${props => getStateColor(props.state)};
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

const Overlay = styled.div<InputProps>`
    bottom: 1px;
    top: 1px;
    left: 1px;
    right: 1px;
    border: 1px solid transparent;
    border-radius: 3px;
    position: absolute;
    background-image: linear-gradient(to right, rgba(0, 0, 0, 0) 0%, rgba(255, 255, 255, 1) 220px);
    z-index: 1;
`;

interface WrapperProps {
    dataTest?: string;
    display?: InputDisplay;
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    innerRef?: React.RefObject<HTMLInputElement>;
    variant?: InputVariant;
    display?: InputDisplay;
    button?: InputButton;
    topLabel?: string;
    bottomText?: string;
    monospace?: boolean;
    isDisabled?: boolean;
    autoComplete?: string;
    autoCorrect?: string;
    autoCapitalize?: string;
    spellCheck?: boolean;
    isLoading?: boolean;
    isPartiallyHidden?: boolean;
    wrapperProps?: Record<string, any>;
    type?: string;
    state?: InputState;
    align?: TextAlign;
}

const Input = ({
    type = 'text',
    innerRef,
    state,
    variant = 'large',
    display = 'default',
    button,
    topLabel,
    bottomText,
    isDisabled,
    autoComplete = 'off',
    autoCorrect = 'off',
    autoCapitalize = 'off',
    monospace,
    wrapperProps,
    isLoading,
    isPartiallyHidden,
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
        <Wrapper display={display} {...wrapperProps}>
            {topLabel && <Label>{topLabel}</Label>}
            <InputWrapper>
                <InputIconWrapper>
                    {isLoading && (
                        <SpinnerWrapper>
                            <FluidSpinner size={16} color={colors.GREEN} />
                        </SpinnerWrapper>
                    )}
                    {button && (
                        <Button
                            onClick={button.onClick}
                            onMouseEnter={handleButtonEnter}
                            onMouseLeave={handleButtonLeave}
                        >
                            {button.icon && (
                                <StyledIcon
                                    icon={button.icon}
                                    size={10}
                                    color={buttonHover ? colors.BLACK0 : colors.BLACK50}
                                />
                            )}
                            {button.text && <ButtonText>{button.text}</ButtonText>}
                        </Button>
                    )}
                    {state && (
                        <StateIconWrapper>
                            <Icon
                                icon={getStateIcon(state)}
                                color={getStateColor(state)}
                                size={10}
                            />
                        </StateIconWrapper>
                    )}
                </InputIconWrapper>
                {isPartiallyHidden && <Overlay />}
                <StyledInput
                    type={type}
                    autoComplete={autoComplete}
                    autoCorrect={autoCorrect}
                    autoCapitalize={autoCapitalize}
                    spellCheck={false}
                    state={state}
                    variant={variant}
                    disabled={isDisabled}
                    display={display}
                    monospace={monospace}
                    align={align}
                    ref={innerRef}
                    data-lpignore="true"
                    {...rest}
                />
            </InputWrapper>
            {bottomText && <BottomText state={state}>{bottomText}</BottomText>}
        </Wrapper>
    );
};

export { Input };
