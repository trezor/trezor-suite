import { useState, Ref, ReactNode, ReactElement, InputHTMLAttributes } from 'react';
import styled, { useTheme } from 'styled-components';
import { useMeasure } from 'react-use';
import { spacingsPx, spacings, typography } from '@trezor/theme';

import { InputState, InputSize } from '../../../support/types';
import { motionEasingStrings } from '../../../config/motion';
import { Icon } from '../../assets/Icon/Icon';
import {
    Label as TopLabel,
    RightLabel,
    baseInputStyle,
    INPUT_HEIGHTS,
    LabelHoverAddon,
    BaseInputProps,
    INPUT_BORDER_WIDTH,
} from '../InputStyles';
import { BOTTOM_TEXT_MIN_HEIGHT, BottomText } from '../BottomText';

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

const getExtraAddonPadding = (size: InputSize) =>
    (size === 'small' ? spacings.sm : spacings.md) + spacings.xs;

const StyledInput = styled.input<StyledInputProps & { isWithLabel: boolean }>`
    ${baseInputStyle}

    width: 100%;
    height: ${({ $size }) => `${INPUT_HEIGHTS[$size as InputSize]}px`};
    padding: 0 ${spacingsPx.md};
    padding-top: ${({ isWithLabel }) => isWithLabel && '18px'};
    padding-left: ${({ leftAddonWidth, $size }) =>
        leftAddonWidth ? `${leftAddonWidth + getExtraAddonPadding($size)}px` : undefined};
    padding-right: ${({ rightAddonWidth, $size }) =>
        rightAddonWidth ? `${rightAddonWidth + getExtraAddonPadding($size)}px` : undefined};
    ${({ $size }) => $size === 'small' && typography.hint};
`;

const InputWrapper = styled.div`
    display: flex;
    position: relative;
    width: 100%;
`;

const getInputAddonPadding = (size: InputSize) =>
    size === 'small' ? spacingsPx.sm : spacingsPx.md;

const InputAddon = styled.div<{ align: innerAddonAlignment; size: InputSize }>`
    position: absolute;
    top: 0;
    bottom: 0;
    right: ${({ align, size }) => align === 'right' && getInputAddonPadding(size)};
    left: ${({ align, size }) => align === 'left' && getInputAddonPadding(size)};
    display: flex;
    align-items: center;
`;

const Label = styled.label<{ $size: InputSize; isDisabled?: boolean }>`
    position: absolute;
    left: calc(${spacingsPx.md} + ${INPUT_BORDER_WIDTH}px);
    color: ${({ theme, isDisabled }) => (isDisabled ? theme.textDisabled : theme.textSubdued)};
    ${typography.body};
    line-height: ${({ $size }) => `${INPUT_HEIGHTS[$size as InputSize]}px`};
    transition: transform 0.12s ${motionEasingStrings.enter},
        font-size 0.12s ${motionEasingStrings.enter};
    transform-origin: 0;
    pointer-events: none;

    /* move up when input is focused OR has a placeholder OR has value  */
    ${StyledInput}:focus + &, 
    /*Linting error because of a complex interpolation*/
    ${/* sc-selector */ StyledInput}:not(:placeholder-shown) + &, 
    ${/* sc-selector */ StyledInput}:not([placeholder=""]):placeholder-shown + & {
        transform: translate(0px, -10px) scale(0.75);
    }
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
     * @description pass `null` if bottom text can be `undefined`
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
    placeholder,
    onClear,
    ...rest
}: InputProps) => {
    const [isHovered, setIsHovered] = useState(false);

    const theme = useTheme();

    const hasShowClearButton =
        (showClearButton === 'always' || (showClearButton === 'hover' && isHovered)) &&
        value &&
        value?.length > 0;

    const [measureLeftAddon, { width: leftAddonWidth }] = useMeasure<HTMLDivElement>();
    const [measureRightAddon, { width: rightAddonWidth }] = useMeasure<HTMLDivElement>();

    const isWithTopLabel = labelHoverAddon || labelRight;

    return (
        <Wrapper
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            withBottomPadding={bottomText === null}
            data-test={dataTest}
        >
            {isWithTopLabel && (
                <TopLabel>
                    <LabelHoverAddon isVisible={isHovered}>{labelHoverAddon}</LabelHoverAddon>
                    {labelRight && <RightLabel>{labelRight}</RightLabel>}
                </TopLabel>
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
                    isWithLabel={!!label}
                    placeholder={placeholder || ''} // needed for uncontrolled inputs
                    {...rest}
                />

                {label && (
                    <Label $size={size} isDisabled={isDisabled}>
                        {label}
                    </Label>
                )}
            </InputWrapper>

            {bottomText && <BottomText inputState={inputState}>{bottomText}</BottomText>}
        </Wrapper>
    );
};

Input.InputAddon = InputAddon;

export { Input };
