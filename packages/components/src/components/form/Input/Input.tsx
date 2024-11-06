import { useState, Ref, ReactNode, ReactElement, InputHTMLAttributes } from 'react';
import { useMeasure } from 'react-use';

import styled, { useTheme } from 'styled-components';

import { spacingsPx, spacings, typography } from '@trezor/theme';

import { Icon } from '../../Icon/Icon';
import {
    baseInputStyle,
    INPUT_HEIGHTS,
    BaseInputProps,
    Label,
    LABEL_TRANSFORM,
} from '../InputStyles';
import { BOTTOM_TEXT_MIN_HEIGHT, BottomText } from '../BottomText';
import { InputState, InputSize } from '../inputTypes';
import { TopAddons } from '../TopAddons';
import { useElevation } from '../../ElevationContext/ElevationContext';
import { UIHorizontalAlignment } from '../../../config/types';
import {
    TextPropsKeys,
    withTextProps,
    TextProps,
    pickAndPrepareTextProps,
} from '../../typography/utils';
import { TransientProps } from '../../../utils/transientProps';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../../utils/frameProps';

export const allowedInputFrameProps = [
    'margin',
    'width',
    'maxWidth',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedInputFrameProps)[number]>;

export const allowedInputTextProps = [
    'typographyStyle',
    'align',
] as const satisfies TextPropsKeys[];
type AllowedTextProps = Pick<TextProps, (typeof allowedInputTextProps)[number]>;

type WrapperProps = TransientProps<AllowedFrameProps> & { $hasBottomPadding: boolean };

const Wrapper = styled.div<WrapperProps>`
    display: inline-flex;
    flex-direction: column;
    width: 100%;
    padding-bottom: ${({ $hasBottomPadding }) =>
        $hasBottomPadding ? `${BOTTOM_TEXT_MIN_HEIGHT}px` : '0'};

    ${withFrameProps}
`;

interface StyledInputProps extends BaseInputProps {
    $size: InputSize;
    $leftAddonWidth?: number;
    $rightAddonWidth?: number;
    $isWithLabel: boolean;
}

const getExtraAddonPadding = (size: InputSize) =>
    (size === 'small' ? spacings.sm : spacings.md) + spacings.xs;

const StyledInput = styled.input<StyledInputProps & TransientProps<AllowedTextProps>>`
    padding: 0 ${spacingsPx.md};
    padding-left: ${({ $leftAddonWidth, $size }) =>
        $leftAddonWidth ? `${$leftAddonWidth + getExtraAddonPadding($size)}px` : undefined};
    padding-right: ${({ $rightAddonWidth, $size }) =>
        $rightAddonWidth ? `${$rightAddonWidth + getExtraAddonPadding($size)}px` : undefined};
    height: ${({ $size }) => `${INPUT_HEIGHTS[$size as InputSize]}px`};
    ${baseInputStyle}
    ${({ $size }) => $size === 'small' && typography.hint};
    ${withTextProps}

    &:disabled {
        pointer-events: auto;
        cursor: not-allowed;
    }
`;

const InputWrapper = styled.div`
    display: flex;
    position: relative;
    width: 100%;
`;

const getInputAddonPadding = (size: InputSize) =>
    size === 'small' ? spacingsPx.sm : spacingsPx.md;

const InputAddon = styled.div<{ $align: innerAddonAlignment; $size: InputSize }>`
    position: absolute;
    inset: 0 ${({ $align, $size }) => ($align === 'right' ? getInputAddonPadding($size) : 'auto')} 0
        ${({ $align, $size }) => ($align === 'left' ? getInputAddonPadding($size) : 'auto')};
    display: flex;
    align-items: center;
`;

const InputLabel = styled(Label)`
    /* move up when input is focused OR has a placeholder OR has value  */
    input:focus ~ &,
    input:not(:placeholder-shown) ~ &,
    input:not([value='']) ~ & {
        transform: ${LABEL_TRANSFORM};
    }
`;

type innerAddonAlignment = Extract<UIHorizontalAlignment, 'left' | 'right'>;

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> &
    AllowedFrameProps &
    AllowedTextProps & {
        value?: string;
        innerRef?: Ref<HTMLInputElement>;
        label?: ReactElement | string;
        labelHoverRight?: React.ReactNode;
        labelLeft?: React.ReactNode;
        labelRight?: React.ReactNode;
        innerAddon?: ReactElement;
        /**
         * @description pass `null` if bottom text can be `undefined`
         */
        bottomText?: ReactNode;
        bottomTextIconComponent?: ReactNode;
        isDisabled?: boolean;
        size?: InputSize;
        className?: string;
        'data-testid'?: string;
        inputState?: InputState; // TODO: do we need this? we only have the error state right now
        innerAddonAlign?: innerAddonAlignment;
        hasBottomPadding?: boolean;
        /**
         * @description the clear button replaces the addon on the right side
         */
        showClearButton?: 'hover' | 'always';
        onClear?: () => void;
    };

const Input = ({
    value,
    innerRef,
    inputState,
    label,
    labelLeft,
    labelRight,
    labelHoverRight,
    innerAddon,
    bottomTextIconComponent,
    innerAddonAlign = 'right',
    bottomText,
    size = 'large',
    isDisabled,
    'data-testid': dataTest,
    showClearButton,
    placeholder,
    onClear,
    hasBottomPadding = true,
    className,
    ...rest
}: InputProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const theme = useTheme();
    const { elevation } = useElevation();
    const frameProps = pickAndPrepareFrameProps(rest, allowedInputFrameProps);
    const textProps = pickAndPrepareTextProps(rest, allowedInputTextProps);

    const hasShowClearButton =
        (showClearButton === 'always' || (showClearButton === 'hover' && isHovered)) &&
        value &&
        value?.length > 0;

    const [measureLeftAddon, { width: leftAddonWidth }] = useMeasure<HTMLDivElement>();
    const [measureRightAddon, { width: rightAddonWidth }] = useMeasure<HTMLDivElement>();

    return (
        <Wrapper
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            $hasBottomPadding={hasBottomPadding === true && bottomText === null}
            className={className}
            {...frameProps}
        >
            <TopAddons
                isHovered={isHovered}
                addonLeft={labelLeft}
                hoverAddonRight={labelHoverRight}
                addonRight={labelRight}
            />

            <InputWrapper>
                {innerAddon && innerAddonAlign === 'left' && (
                    <InputAddon $align="left" ref={measureLeftAddon} $size={size}>
                        {innerAddon}
                    </InputAddon>
                )}

                {((innerAddon && innerAddonAlign === 'right') || hasShowClearButton) && (
                    <InputAddon $align="right" ref={measureRightAddon} $size={size}>
                        {!hasShowClearButton && innerAddon}

                        {hasShowClearButton && (
                            <Icon
                                name="cancel"
                                size={16}
                                onClick={onClear}
                                color={theme.legacy.TYPE_DARK_GREY}
                                cursorPointer
                            />
                        )}
                    </InputAddon>
                )}

                <StyledInput
                    $elevation={elevation}
                    value={value}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    $inputState={inputState}
                    disabled={isDisabled}
                    $size={size}
                    ref={innerRef}
                    data-lpignore="true"
                    $leftAddonWidth={leftAddonWidth}
                    $rightAddonWidth={rightAddonWidth}
                    $isWithLabel={!!label}
                    placeholder={placeholder || ''} // needed for uncontrolled inputs
                    data-testid={dataTest}
                    {...textProps}
                    {...rest}
                />

                {label && (
                    <InputLabel $size={size} $isDisabled={isDisabled}>
                        {label}
                    </InputLabel>
                )}
            </InputWrapper>

            {bottomText && (
                <BottomText
                    inputState={inputState}
                    isDisabled={isDisabled}
                    iconComponent={bottomTextIconComponent}
                >
                    {bottomText}
                </BottomText>
            )}
        </Wrapper>
    );
};

Input.InputAddon = InputAddon;

export { Input };
