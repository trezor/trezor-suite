import { useCallback, useState, Ref, ReactNode, ReactElement, InputHTMLAttributes } from 'react';
import styled from 'styled-components';

import { FONT_SIZE } from '../../../config/variables';
import { InputState, InputSize } from '../../../support/types';
import { useTheme } from '../../../utils';
import { Icon } from '../../assets/Icon/Icon';
import {
    Label,
    LabelLeft,
    LabelRight,
    RightLabel,
    baseInputStyle,
    INPUT_HEIGHTS,
    getInputStateTextColor,
    LabelHoverAddon,
    BaseInputProps,
} from '../InputStyles';

const BOTTOM_TEXT_MIN_HEIGHT = 22;

const Wrapper = styled.div<Pick<InputProps, 'width'> & { withBottomPadding: boolean }>`
    display: inline-flex;
    flex-direction: column;
    width: ${({ width }) => (width ? `${width}px` : '100%')};
    padding-bottom: ${({ withBottomPadding }) =>
        withBottomPadding ? `${BOTTOM_TEXT_MIN_HEIGHT}px` : '0'};
`;

interface StyledInputProps extends BaseInputProps {
    $size: InputSize;
    leftAddonWidth?: number;
    rightAddonWidth?: number;
}

const StyledInput = styled.input<StyledInputProps>`
    ${baseInputStyle}

    width: 100%;
    height: ${({ $size }) => `${INPUT_HEIGHTS[$size as InputSize]}px`};
    padding: 1px 16px 0 16px;
    padding-left: ${({ leftAddonWidth }) =>
        leftAddonWidth ? `${leftAddonWidth + 19}px` : undefined};
    padding-right: ${({ rightAddonWidth }) =>
        rightAddonWidth ? `${rightAddonWidth + 19}px` : undefined};
`;

const InputWrapper = styled.div`
    display: flex;
    position: relative;
    width: 100%;
`;

const InputAddon = styled.div<{ align: innerAddonAlignment; size: InputSize }>`
    position: absolute;
    top: 1px;
    bottom: 1px;
    right: ${({ align, size }) => align === 'right' && (size === 'small' ? '10px' : '16px')};
    left: ${({ align, size }) => align === 'left' && (size === 'small' ? '10px' : '16px')};
    display: flex;
    align-items: center;
`;

const BottomText = styled.div<Pick<InputProps, 'inputState'>>`
    display: flex;
    padding: 6px 10px 0 10px;
    min-height: ${BOTTOM_TEXT_MIN_HEIGHT}px;
    font-size: ${FONT_SIZE.TINY};
    color: ${({ inputState, theme }) => getInputStateTextColor(inputState, theme)};
`;

type innerAddonAlignment = 'left' | 'right';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    value?: string;
    innerRef?: Ref<HTMLInputElement>;
    label?: ReactElement | string;
    labelHoverAddon?: ReactElement;
    labelRight?: ReactElement;
    innerAddon?: ReactElement;
    /**
     * @description pass `null` if bottom text can be `undefine`
     */
    bottomText?: ReactNode;
    isDisabled?: boolean;
    size?: InputSize;
    className?: string;
    dataTest?: string;
    inputState?: InputState;
    innerAddonAlign?: innerAddonAlignment;
    /**
     * @description the clear button replaces the addon on the right side
     */
    showClearButton?: 'hover' | 'always';
    onClear?: () => void;
}

const Input = ({
    value,
    innerRef,
    inputState,
    label,
    labelHoverAddon,
    labelRight,
    innerAddon,
    innerAddonAlign = 'right',
    bottomText,
    size = 'large',
    isDisabled,
    className,
    dataTest,
    showClearButton,
    onClear,
    ...rest
}: InputProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const [leftAddonWidth, setLeftAddonWidth] = useState(0);
    const [rightAddonWidth, setRightAddonWidth] = useState(0);

    const theme = useTheme();

    const hasShowClearButton =
        (showClearButton === 'always' || (showClearButton === 'hover' && isHovered)) &&
        value &&
        value?.length > 0;

    const measureLeftAddon = useCallback((element: HTMLDivElement) => {
        const elementWidth = element?.getBoundingClientRect().width ?? 0;

        setLeftAddonWidth(elementWidth);
    }, []);

    const measureRightAddon = useCallback((element: HTMLDivElement) => {
        const elementWidth = element?.getBoundingClientRect().width ?? 0;

        setRightAddonWidth(elementWidth);
    }, []);

    const isWithLabel = label || labelHoverAddon || labelRight;

    return (
        <Wrapper
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            withBottomPadding={bottomText === null}
            data-test={dataTest}
        >
            {isWithLabel && (
                <Label>
                    <LabelLeft>{label}</LabelLeft>
                    <LabelRight>
                        <LabelHoverAddon isVisible={isHovered}>{labelHoverAddon}</LabelHoverAddon>
                        {labelRight && <RightLabel>{labelRight}</RightLabel>}
                    </LabelRight>
                </Label>
            )}

            <InputWrapper>
                {innerAddon && innerAddonAlign === 'left' && (
                    <InputAddon align="left" ref={measureLeftAddon} size={size}>
                        {innerAddon}
                    </InputAddon>
                )}

                {((innerAddon && innerAddonAlign === 'right') || hasShowClearButton) && (
                    <InputAddon align="right" ref={measureRightAddon} size={size}>
                        {!hasShowClearButton && innerAddon}

                        {hasShowClearButton && (
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

                <StyledInput
                    value={value}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    inputState={inputState}
                    disabled={isDisabled}
                    $size={size}
                    ref={innerRef}
                    data-lpignore="true"
                    leftAddonWidth={leftAddonWidth}
                    rightAddonWidth={rightAddonWidth}
                    {...rest}
                />
            </InputWrapper>

            {bottomText && <BottomText inputState={inputState}>{bottomText}</BottomText>}
        </Wrapper>
    );
};

Input.InputAddon = InputAddon;

export { Input };
