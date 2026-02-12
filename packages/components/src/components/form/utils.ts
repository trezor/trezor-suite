import { css } from 'styled-components';

import { SpacingValuesNew, TypographyStyle } from '@trezor/theme';

import { InputSize } from './types';

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
    small: 'hint',
    large: 'body',
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
        color: ${({ theme }) => theme.textDisabled};
    }
`;

export const INPUT_PADDING: SpacingValuesNew = 16;
