import { css } from 'styled-components';

import { type SpacingValuesNew, type TypographyStyle, borders } from '@trezor/theme';

import { type InputSize } from './types';
import { commonFocusStyles } from '../../utils/utils';

const heightMap: Record<InputSize, number> = {
    small: 36,
    large: 56,
};

export const mapSizeToHeight = (size: InputSize): number => heightMap[size];

const paddingTopMap: Record<InputSize, SpacingValuesNew> = {
    small: 16,
    large: 20,
};

export const mapSizeToPaddingTop = (size: InputSize): SpacingValuesNew => paddingTopMap[size];

const typographyStyleMap: Record<InputSize, TypographyStyle> = {
    small: 'body-sm',
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
    color: inherit;
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

export const INPUT_PADDING: SpacingValuesNew = 16;

export const commonCheckInputStyles = css`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: ${borders.widths.large} solid;
    transition: 0.1s ease-in-out;

    ${({ theme }) => css`
        border-color: ${theme.contentSecondary};
        background-color: ${theme.surfaceFillRaised};

        input:checked + & {
            border-color: ${theme.legacyBackgroundPrimaryDefault};
        }

        input:disabled:not(:checked) + & {
            border-color: ${theme.borderNeutral};
            background-color: ${theme.surfaceFillSunken};
        }

        label:hover > input:not(:disabled, :checked) + & {
            border-color: ${theme.elementBorderFieldFocused};
            background-color: ${theme.surfaceFillPage};
        }

        input:focus-visible + & {
            ${commonFocusStyles}
        }
    `}
`;
