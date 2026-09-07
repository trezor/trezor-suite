import { css } from 'styled-components';

import { type SpacingValue, type TypographyStyle } from '@trezor/theme';

import { type InputSize, type SelectionControlIntent } from './types';
import { commonFocusStyles } from '../../utils/utils';

const heightMap: Record<InputSize, number> = {
    small: 36,
    medium: 44,
    large: 56,
};

export const mapSizeToHeight = (size: InputSize): number => heightMap[size];

const paddingTopMap: Record<InputSize, SpacingValue> = {
    small: 16,
    medium: 16,
    large: 20,
};

export const mapSizeToPaddingTop = (size: InputSize): SpacingValue => paddingTopMap[size];

const typographyStyleMap: Record<InputSize, TypographyStyle> = {
    small: 'body-sm',
    medium: 'body-sm',
    large: 'body-md',
};

export const mapSizeToTypographyStyle = (size: InputSize): TypographyStyle =>
    typographyStyleMap[size];

export const commonInputStyles = css`
    width: 100%;
    height: 100%;
    border: none;
    background: transparent;
    outline: none;
    color: ${({ theme }) => theme.contentPrimary};
    font-size: inherit;
    letter-spacing: inherit;
    font-weight: inherit;
    line-height: inherit;
    font-feature-settings:
        'tnum' 1,
        'zero' 1,
        'ss03' 1;

    &::placeholder {
        color: ${({ theme }) => theme.contentDisabled};
    }
`;

export const INPUT_PADDING: SpacingValue = 16;

export const commonCheckInputStyles = css<{ $intent?: SelectionControlIntent }>`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: 2px solid;
    transition: 0.1s ease-in-out;

    ${({ theme, $intent }) => css`
        border-color: ${theme.elementBorderField};
        background-color: ${theme.elementFillField};

        input:hover + & {
            background-color: ${theme.elementFillFieldHovered};
            border-color: ${theme.elementBorderFieldHovered};
        }

        input:checked + & {
            border-color: ${theme[$intent === 'debug' ? 'elementFillDebugBold' : 'elementFillFieldSelected']};
            background-color: ${theme[$intent === 'debug' ? 'elementFillDebugBold' : 'elementFillFieldSelected']};
        }

        input:checked:hover + & {
            background-color: ${theme[$intent === 'debug' ? 'elementFillDebugBoldHovered' : 'elementFillFieldSelectedHovered']};
            border-color: ${theme[$intent === 'debug' ? 'elementFillDebugBoldHovered' : 'elementFillFieldSelectedHovered']};
        }

        input:disabled:not(:checked) + & {
            border-color: ${theme.elementBorderFieldDisabled};
            background-color: ${theme.elementFillFieldDisabled};
        }

        input:focus-visible + & {
            ${commonFocusStyles}
        }
    `}
`;
