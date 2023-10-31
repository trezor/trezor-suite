import styled, { css, DefaultTheme } from 'styled-components';
import { borders, spacingsPx, typography } from '@trezor/theme';

import { FONT_WEIGHT, FONT_SIZE } from '../../config/variables';
import { InputState, InputSize } from './inputTypes';
import { motionEasingStrings } from '../../config/motion';

export const INPUT_HEIGHTS: Record<InputSize, number> = {
    small: 36,
    large: 56,
};

export const INPUT_BORDER_WIDTH = Number.parseFloat(borders.widths.large);

export const getInputStateTextColor = (state: InputState | undefined, theme: DefaultTheme) => {
    switch (state) {
        case 'warning':
            return theme.textAlertYellow;
        case 'error':
            return theme.textAlertRed;
        default:
            return theme.textSubdued;
    }
};

export const getInputStateBorderColor = (state: InputState | undefined, theme: DefaultTheme) => {
    switch (state) {
        case 'warning':
            return theme.textAlertYellow;
        case 'error':
            return theme.borderAlertRed;
        default:
            return 'transparent';
    }
};

export const getInputStateBgColor = (state: InputState | undefined, theme: DefaultTheme) => {
    switch (state) {
        case 'warning':
            return theme.backgroundAlertYellowSubtleOnElevation1;
        case 'error':
            return theme.backgroundAlertRedSubtleOnElevation1;
        default:
            return theme.backgroundNeutralSubtleOnElevation0;
    }
};

export const INPUT_PADDING_TOP = '18px';

export interface BaseInputProps {
    inputState?: InputState;
    disabled?: boolean;
    isWithLabel?: boolean;
}

export const baseInputStyle = css<BaseInputProps>`
    width: 100%;
    padding-top: ${({ isWithLabel }) => isWithLabel && INPUT_PADDING_TOP};
    background-color: ${({ theme, inputState }) => getInputStateBgColor(inputState, theme)};
    border-radius: ${borders.radii.sm};
    border: solid ${INPUT_BORDER_WIDTH}px;
    border-color: ${({ inputState, theme }) => getInputStateBorderColor(inputState, theme)};
    color: ${({ theme }) => theme.textDefault};
    ${typography.body}
    transition: border-color 0.1s;
    outline: none;
    font-variant-numeric: slashed-zero tabular-nums;

    ::placeholder {
        color: ${({ theme }) => theme.textSubdued};
    }

    :read-only:not(:disabled) {
        background: ${({ theme }) => theme.backgroundNeutralDisabled};
        color: ${({ theme }) => theme.textDisabled};
    }

    :focus,
    :focus-within {
        border-color: ${({ theme }) => theme.borderOnElevation0};
    }

    ${({ disabled }) =>
        disabled &&
        css`
            box-shadow: none;
            background: ${({ theme }) => theme.backgroundNeutralDisabled};
            color: ${({ theme }) => theme.textDisabled};
            pointer-events: none;
            cursor: default;
        `}
`;

export const InputWrapper = styled.div`
    display: flex;
    position: relative;
    width: 100%;
`;

export const LabelLeft = styled.label`
    margin-bottom: 8px;
    font-size: ${FONT_SIZE.SMALL};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

export const RightLabel = styled.div`
    display: flex;
    align-items: center;
    padding-left: 5px;
`;

export const LABEL_TRANSFORM = 'translate(0px, -10px) scale(0.75)';

export const Label = styled.label<{ $size?: InputSize; isDisabled?: boolean }>`
    position: absolute;
    left: calc(${spacingsPx.md} + ${INPUT_BORDER_WIDTH}px);
    color: ${({ theme, isDisabled }) => (isDisabled ? theme.textDisabled : theme.textSubdued)};
    ${typography.body};
    line-height: ${({ $size }) => $size && `${INPUT_HEIGHTS[$size as InputSize]}px`};
    transition:
        transform 0.12s ${motionEasingStrings.enter},
        font-size 0.12s ${motionEasingStrings.enter};
    transform-origin: 0;
    pointer-events: none;
`;
