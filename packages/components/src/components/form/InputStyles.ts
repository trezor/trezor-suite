import styled, { css, DefaultTheme } from 'styled-components';
import { borders, typography } from '@trezor/theme';

import { FONT_WEIGHT, FONT_SIZE } from '../../config/variables';
import { InputState, InputSize } from '../../support/types';

export const INPUT_HEIGHTS: Record<InputSize, number> = {
    small: 36,
    large: 56,
};

export const INPUT_BORDER_WIDTH = 2;

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

export interface BaseInputProps {
    inputState?: InputState;
    disabled?: boolean;
}

export const baseInputStyle = css<BaseInputProps>`
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

    :focus {
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

export const Label = styled.div`
    display: flex;
    justify-content: end;
    align-items: flex-end;
    min-height: 30px;
    padding-bottom: 6px;
`;

export const LabelLeft = styled.label`
    margin-bottom: 8px;
    font-size: ${FONT_SIZE.SMALL};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

export const LabelHoverAddon = styled.div<{ isVisible?: boolean }>`
    visibility: ${({ isVisible }) => !isVisible && 'hidden'};
`;

export const LabelRight = styled.div`
    display: flex;
    align-items: center;
`;

export const RightLabel = styled.div`
    display: flex;
    align-items: center;
    padding-left: 5px;
`;
