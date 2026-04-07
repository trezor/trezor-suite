import { css } from 'styled-components';

import { type CSSColor } from '@trezor/theme';

export const focusStyleTransition = 'box-shadow 0.1s ease-out, border-color 0.1s ease-out';

export const getFocusShadowStyle = (selector = '&:focus-visible') => css`
    ${selector} {
        border-color: ${({ theme }) => theme.backgroundAlertBlueBold};
        box-shadow: ${({ theme }) => theme.boxShadowFocused};
    }
`;

export const commonFocusStyles = css`
    outline: 4px solid ${({ theme }) => theme.elementBorderFocusRing};
    outline-offset: 2px;
`;

export const addAlphaToHex = (hex: CSSColor, percent: number): CSSColor => {
    const cleanHex = hex.replace(/^#/, '');
    const clampedPercent = Math.min(1, Math.max(0, percent));

    const normalizedHex =
        cleanHex.length === 3 || cleanHex.length === 4
            ? cleanHex
                  .split('')
                  .map(c => c + c)
                  .join('')
            : cleanHex;

    const rgbHex = normalizedHex.slice(0, 6);
    const existingAlphaHex = normalizedHex.length === 8 ? normalizedHex.slice(6, 8) : 'FF';
    const baseAlpha = parseInt(existingAlphaHex, 16);
    const newAlphaHex = Math.round(baseAlpha * clampedPercent)
        .toString(16)
        .padStart(2, '0')
        .toUpperCase();

    return `#${rgbHex}${newAlphaHex}`;
};
