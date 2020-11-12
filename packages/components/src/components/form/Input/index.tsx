import * as React from 'react';
import styled, { css } from 'styled-components';
import { colors, variables } from '../../../config';
import { InputState, InputVariant } from '../../../support/types';
import { Icon } from '../../../index';
import { getStateColor } from '../../../utils';
import { useEffect, createRef } from 'react';

interface WrappedProps {
    width?: any;
}

const Wrapper = styled.div<WrappedProps>`
    display: inline-flex;
    flex-direction: column;
    width: ${props => (props.width ? `${props.width}px` : '100%')};
`;

interface InputProps extends Props {
    inputAddonWidth?: number;
}

const StyledInput = styled.input<InputProps>`
    /* text-indent: ${props => props.textIndent}px; */
    font-family: ${variables.FONT_FAMILY.TTHOVES};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    /*  this is a bit messy, but basically we want to add textIndent to left/right paddings */
    padding: 1px ${props => (props.textIndent ? `${props.textIndent[1] + 16}px` : '16px')} 0
        ${props => (props.textIndent ? `${props.textIndent[0] + 16}px` : '16px')};
    font-size: ${variables.FONT_SIZE.SMALL};
    border-radius: 4px;
    border: solid 2px
        ${props => (props.state ? getStateColor(props.state) : colors.NEUE_STROKE_GREY)};
    background-color: ${colors.WHITE};
    outline: none;
    box-sizing: border-box;
    width: 100%;
    height: ${props => (props.variant === 'small' ? '32px' : '48px')};
    color: ${props => getStateColor(props.state)};

    &:read-only {
        background: ${colors.BLACK96};
        box-shadow: none;
        color: ${colors.BLACK50};
    }

    &::placeholder {
        color: ${colors.NEUE_TYPE_LIGHT_GREY};
    }

    ${props =>
        props.monospace &&
        css`
            font-variant-numeric: slashed-zero tabular-nums;
        `}

    /* TODO: padding for left input addon */
    ${props =>
        props.inputAddonWidth &&
        css`
            padding-right: ${props.inputAddonWidth}px;
        `};

    ${props =>
        props.disabled &&
        css`
            background: ${colors.BLACK96};
            box-shadow: none;
            color: ${colors.BLACK50};
            cursor: default;
        `}
`;

const InputWrapper = styled.div`
    display: flex;
    position: relative;
`;

const Label = styled.div`
    display: flex;
    min-height: 32px;
    justify-content: space-between;
`;

const Left = styled.div`
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    padding: 0 0 12px 0;
    color: ${colors.NEUE_TYPE_DARK_GREY};
`;

const Right = styled.div`
    display: flex;
`;

const LabelAddon = styled.div``;

const VisibleRightLabel = styled.div`
    padding-left: 5px;
`;

const InputAddon = styled.div<{ align: 'left' | 'right' }>`
    position: absolute;
    top: 1px;
    bottom: 1px;
    display: flex;
    align-items: center;

    ${props =>
        props.align === 'right' &&
        css`
            right: 10px;
        `}

    ${props =>
        props.align === 'left' &&
        css`
            left: 10px;
        `}
`;

const BottomText = styled.div<Props>`
    padding: 10px 10px 0 10px;
    min-height: 27px;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${props => getStateColor(props.state)};
`;

const Overlay = styled.div<Props>`
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

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
    value?: string;
    innerRef?: React.Ref<HTMLInputElement>;
    variant?: InputVariant;
    label?: React.ReactElement | string;
    labelAddon?: React.ReactElement;
    labelRight?: React.ReactElement;
    innerAddon?: React.ReactNode;
    topLabelRight?: React.ReactNode;
    bottomText?: React.ReactNode;
    monospace?: boolean;
    isDisabled?: boolean;
    className?: string;
    autoComplete?: string;
    autoCorrect?: string;
    autoCapitalize?: string;
    spellCheck?: boolean;
    isLoading?: boolean;
    dataTest?: string;
    isPartiallyHidden?: boolean;
    wrapperProps?: Record<string, any>;
    type?: string;
    state?: InputState;
    addonAlign?: 'left' | 'right';
    noError?: boolean;
    noTopLabel?: boolean;
    labelAddonIsVisible?: boolean;
    textIndent?: [number, number]; // [left, right]
    clearButton?: boolean;
    onClear?: () => void;
}

const Input = ({
    value,
    type = 'text',
    innerRef,
    state,
    variant = 'large',
    width,
    label,
    labelAddon,
    labelRight,
    innerAddon,
    topLabelRight,
    bottomText,
    isDisabled,
    className,
    autoComplete = 'off',
    autoCorrect = 'off',
    autoCapitalize = 'off',
    monospace,
    wrapperProps,
    labelAddonIsVisible,
    isLoading,
    dataTest,
    isPartiallyHidden,
    clearButton,
    onClear,
    addonAlign = 'right',
    noError = false,
    noTopLabel = false,
    textIndent = [0, 0],
    ...rest
}: Props) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const inputAddonRef = createRef<HTMLDivElement>();
    const [inputAddonWidth, setInputAddonWidth] = React.useState(0);

    useEffect(() => {
        if (inputAddonRef.current) {
            const rect = inputAddonRef.current.getBoundingClientRect();
            setInputAddonWidth(rect.width + 10); // addon ha absolute pos with 10px offset
        } else {
            setInputAddonWidth(0);
        }
    }, [inputAddonRef]);

    return (
        <Wrapper
            {...wrapperProps}
            data-test={dataTest}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {!noTopLabel && (
                <Label>
                    <Left>{label}</Left>
                    <Right>
                        {labelAddonIsVisible && <LabelAddon>{labelAddon}</LabelAddon>}
                        {isHovered && !labelAddonIsVisible && <LabelAddon>{labelAddon}</LabelAddon>}
                        {labelRight && <VisibleRightLabel>{labelRight}</VisibleRightLabel>}
                    </Right>
                </Label>
            )}
            <InputWrapper>
                {innerAddon && addonAlign === 'left' && (
                    <InputAddon align="left" ref={inputAddonRef}>
                        {innerAddon}
                    </InputAddon>
                )}
                {((innerAddon && addonAlign === 'right') || clearButton) && (
                    <InputAddon align="right" ref={inputAddonRef}>
                        {addonAlign === 'right' && innerAddon}
                        {clearButton && value && value.length > 0 && (
                            <Icon
                                icon="CANCEL"
                                size={12}
                                onClick={onClear}
                                color={colors.NEUE_TYPE_DARK_GREY}
                                useCursorPointer
                            />
                        )}
                    </InputAddon>
                )}

                {isPartiallyHidden && <Overlay />}
                <StyledInput
                    className={className}
                    value={value}
                    textIndent={textIndent}
                    type={type}
                    autoComplete={autoComplete}
                    autoCorrect={autoCorrect}
                    autoCapitalize={autoCapitalize}
                    spellCheck={false}
                    state={state}
                    variant={variant}
                    disabled={isDisabled}
                    width={width}
                    monospace={monospace}
                    ref={innerRef}
                    data-lpignore="true"
                    inputAddonWidth={inputAddonWidth}
                    {...rest}
                />
            </InputWrapper>
            {!noError && <BottomText state={state}>{bottomText}</BottomText>}
        </Wrapper>
    );
};

export { Input, Props as InputProps };
