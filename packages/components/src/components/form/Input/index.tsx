import React, { useCallback, useState } from 'react';
import styled, { css } from 'styled-components';
import { darken } from 'polished';

import { FONT_SIZE, Z_INDEX } from '../../../config/variables';
import { InputState, InputVariant } from '../../../support/types';
import { useTheme } from '../../../utils';
import { Icon } from '../../Icon';
import {
    Label,
    LabelLeft,
    LabelRight,
    RightLabel,
    baseInputStyle,
    INPUT_HEIGHTS,
    getInputStateTextColor,
} from '../InputStyles';

const Wrapper = styled.div<Pick<InputProps, 'width'>>`
    display: inline-flex;
    flex-direction: column;
    width: ${({ width }) => (width ? `${width}px` : '100%')};
`;

interface StyledInputProps extends InputProps {
    leftAddonWidth?: number;
    rightAddonWidth?: number;
}

const StyledInput = styled.input<StyledInputProps>`
    ${baseInputStyle}

    width: 100%;
    height: ${({ variant }) => `${INPUT_HEIGHTS[variant as InputVariant]}px`};
    padding: 1px 16px 0 16px;
    padding-left: ${({ leftAddonWidth }) =>
        leftAddonWidth ? `${leftAddonWidth + 18}px` : undefined};
    padding-right: ${({ rightAddonWidth }) =>
        rightAddonWidth ? `${rightAddonWidth + 18}px` : undefined};
`;

const InputWrapper = styled.div`
    display: flex;
    position: relative;
`;

const InputAddon = styled.div<{ align: AddonAlignment; variant: InputVariant }>`
    position: absolute;
    top: 1px;
    bottom: 1px;
    right: ${({ align, variant }) => align === 'right' && (variant === 'small' ? '10px' : '16px')};
    left: ${({ align, variant }) => align === 'left' && (variant === 'small' ? '10px' : '16px')};
    display: flex;
    align-items: center;
`;

const BottomText = styled.div<Pick<InputProps, 'errorPosition' | 'inputState'>>`
    display: flex;
    font-size: ${FONT_SIZE.TINY};
    color: ${({ inputState, theme }) => getInputStateTextColor(inputState, theme)};

    ${({ errorPosition }) =>
        errorPosition === 'right' &&
        css`
            align-items: flex-end;
            margin-bottom: 4px;
            margin-left: 12px;
        `}

    ${({ errorPosition }) =>
        errorPosition === 'bottom' &&
        css`
            padding: 10px 10px 0 10px;
            min-height: 27px;
        `}
`;

const Overlay = styled.div`
    bottom: 1px;
    top: 1px;
    left: 1px;
    right: 1px;
    border: 1px solid transparent;
    border-radius: 3px;
    position: absolute;
    background-image: linear-gradient(to right, rgba(0, 0, 0, 0) 0%, rgba(255, 255, 255, 1) 220px);
    z-index: ${Z_INDEX.BASE};
`;

const Row = styled.div<Pick<InputProps, 'errorPosition'>>`
    display: flex;
    flex-direction: column;
    flex-direction: ${({ errorPosition }) => errorPosition === 'right' && 'row'};
`;

type AddonAlignment = 'left' | 'right';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    value?: string;
    innerRef?: React.Ref<HTMLInputElement>;
    label?: React.ReactElement | string;
    labelAddon?: React.ReactElement;
    labelRight?: React.ReactElement;
    innerAddon?: React.ReactElement;
    topLabelRight?: React.ReactNode;
    bottomText?: React.ReactNode;
    isMonospace?: boolean;
    isDisabled?: boolean;
    variant?: InputVariant;
    className?: string;
    autoComplete?: string;
    autoCorrect?: string;
    autoCapitalize?: string;
    spellCheck?: boolean;
    dataTest?: string;
    isPartiallyHidden?: boolean;
    wrapperProps?: Record<string, any>;
    type?: string;
    inputState?: InputState;
    addonAlign?: AddonAlignment;
    errorPosition?: 'bottom' | 'right';
    noError?: boolean;
    noTopLabel?: boolean;
    labelAddonIsVisible?: boolean;
    clearButton?: boolean;
    width?: number;
    onClear?: () => void;
}

export const Input = ({
    value,
    type = 'text',
    innerRef,
    inputState,
    width,
    label,
    labelAddon,
    labelRight,
    innerAddon,
    topLabelRight,
    bottomText,
    variant = 'large',
    isDisabled,
    className,
    autoComplete = 'off',
    autoCorrect = 'off',
    autoCapitalize = 'off',
    isMonospace,
    labelAddonIsVisible,
    dataTest,
    isPartiallyHidden,
    clearButton,
    onClear,
    addonAlign = 'right',
    errorPosition = 'bottom',
    noError = false,
    noTopLabel = false,
    ...rest
}: InputProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const [leftAddonWidth, setLeftAddonWidth] = useState(0);
    const [rightAddonWidth, setRightAddonWidth] = useState(0);

    const theme = useTheme();

    const measureLeftAddon = useCallback((element: HTMLDivElement) => {
        const elementWidth = element?.getBoundingClientRect().width ?? 0;

        setLeftAddonWidth(elementWidth);
    }, []);

    const measureRightAddon = useCallback((element: HTMLDivElement) => {
        const elementWidth = element?.getBoundingClientRect().width ?? 0;

        setRightAddonWidth(elementWidth);
    }, []);

    return (
        <Wrapper
            width={width}
            data-test={dataTest}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {!noTopLabel && (
                <Label>
                    <LabelLeft>{label}</LabelLeft>
                    <LabelRight>
                        {labelAddonIsVisible && <div>{labelAddon}</div>}
                        {isHovered && !labelAddonIsVisible && <div>{labelAddon}</div>}
                        {labelRight && <RightLabel>{labelRight}</RightLabel>}
                    </LabelRight>
                </Label>
            )}

            <Row errorPosition={errorPosition}>
                <InputWrapper>
                    {innerAddon && addonAlign === 'left' && (
                        <InputAddon align="left" ref={measureLeftAddon} variant={variant}>
                            {React.cloneElement(innerAddon, { inputHovered: isHovered })}
                        </InputAddon>
                    )}

                    {((innerAddon && addonAlign === 'right') || clearButton) && (
                        <InputAddon align="right" ref={measureRightAddon} variant={variant}>
                            {addonAlign === 'right' &&
                                innerAddon &&
                                React.cloneElement(innerAddon, { inputHovered: isHovered })}

                            {clearButton && value && value.length > 0 && (
                                <Icon
                                    icon="CANCEL"
                                    size={12}
                                    onClick={onClear}
                                    color={theme.TYPE_DARK_GREY}
                                    useCursorPointer
                                />
                            )}
                        </InputAddon>
                    )}

                    {isPartiallyHidden && <Overlay />}

                    <StyledInput
                        className={className}
                        value={value}
                        type={type}
                        autoComplete={autoComplete}
                        autoCorrect={autoCorrect}
                        autoCapitalize={autoCapitalize}
                        spellCheck={false}
                        inputState={inputState}
                        disabled={isDisabled}
                        variant={variant}
                        isMonospace={isMonospace}
                        ref={innerRef}
                        data-lpignore="true"
                        leftAddonWidth={leftAddonWidth}
                        rightAddonWidth={rightAddonWidth}
                        {...rest}
                    />
                </InputWrapper>

                {!noError && (
                    <BottomText errorPosition={errorPosition} inputState={inputState}>
                        {bottomText}
                    </BottomText>
                )}
            </Row>
        </Wrapper>
    );
};
