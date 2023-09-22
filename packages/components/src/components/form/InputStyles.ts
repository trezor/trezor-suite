import { darken } from 'polished';
import styled, { css } from 'styled-components';
import { FONT_WEIGHT, NEUE_FONT_SIZE } from '../../config/variables';
import { InputState, InputSize, SuiteThemeColors } from '../../support/types';

export const INPUT_HEIGHTS: Record<InputSize, number> = {
    small: 32,
    large: 48,
};

export const INPUT_BORDER_RADIUS = 8;
export const INPUT_BORDER_WIDTH = 1;

export const getInputStateTextColor = (state: InputState | undefined, theme: SuiteThemeColors) => {
    switch (state) {
        case 'warning':
            return theme.TYPE_ORANGE;
        case 'error':
            return theme.TYPE_RED;
        default:
            return theme.TYPE_DARK_GREY;
    }
};

export const getInputStateBorderColor = (
    state: InputState | undefined,
    theme: SuiteThemeColors,
) => {
    switch (state) {
        case 'success':
            return theme.TYPE_LIGHT_GREY;
        case 'warning':
            return theme.TYPE_ORANGE;
        case 'error':
            return theme.TYPE_RED;
        default:
            return theme.STROKE_GREY;
    }
};

export const getInputStateBgColor = (state: InputState | undefined, theme: SuiteThemeColors) => {
    switch (state) {
        case 'warning':
            return theme.TYPE_LIGHT_ORANGE;
        case 'error':
            return theme.BG_LIGHT_RED;
        default:
            return theme.BG_WHITE;
    }
};

export interface BaseInputProps {
    inputState?: InputState;
    disabled?: boolean;
}

export const baseInputStyle = css<BaseInputProps>`
    background-color: ${({ theme, inputState }) => getInputStateBgColor(inputState, theme)};
    border-radius: ${INPUT_BORDER_RADIUS}px;
    border: solid ${INPUT_BORDER_WIDTH}px;
    border-color: ${({ inputState, theme }) => getInputStateBorderColor(inputState, theme)};
    color: ${({ inputState, theme }) => getInputStateTextColor(inputState, theme)};
    font-size: ${NEUE_FONT_SIZE.SMALL};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    transition: border-color 0.1s ease-in-out;
    outline: none;
    font-variant-numeric: slashed-zero tabular-nums;

    ::placeholder {
        color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    }

    :read-only:not(:disabled) {
        background: ${({ theme }) => theme.BG_GREY};
        color: ${({ theme }) => theme.TYPE_DARK_GREY};
    }

    :hover {
        border-color: ${({ inputState, theme }) =>
            darken(
                theme.HOVER_DARKEN_FILTER,
                inputState ? getInputStateTextColor(inputState, theme) : theme.STROKE_GREY,
            )};
    }

    :focus {
        border-color: ${({ inputState, theme }) =>
            darken(
                theme.HOVER_DARKEN_FILTER,
                inputState ? getInputStateTextColor(inputState, theme) : theme.TYPE_LIGHT_GREY,
            )};
    }

    ${({ disabled }) =>
        disabled &&
        css`
            background: ${({ theme }) => theme.BG_GREY};
            box-shadow: none;
            color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
            pointer-events: none;
            cursor: default;
        `}
`;

export const Label = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    min-height: 30px;
`;

export const LabelLeft = styled.label`
    margin-bottom: 8px;
    font-size: ${NEUE_FONT_SIZE.SMALL};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

export const LabelAddon = styled.div<{ isVisible?: boolean }>`
    visibility: ${({ isVisible }) => !isVisible && 'hidden'};
`;

export const LabelRight = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 6px;
`;

export const RightLabel = styled.div`
    padding-left: 5px;
`;
