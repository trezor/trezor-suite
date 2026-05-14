import { createGlobalStyle } from 'styled-components';

import type { SuiteThemeColors } from '@trezor/components';
import { fontFamilies, typography } from '@trezor/theme';

type GlobalStyleTheme = SuiteThemeColors & { mode: 'light' | 'dark' };

export const GlobalStyle = createGlobalStyle<{ theme: GlobalStyleTheme }>`
    input, textarea {
        outline: none;
    }

    body, html {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        ${typography['body-md']}
        color: ${({ theme }) => theme.contentPrimary};
        height: 100%;

        /* BlinkMacSystemFont, which is macOS Chrome/Electron suggested fallback font, breaks emojis (e.g. in Guide) so we omit it */
        font-family: "TT Satoshi", -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    }

    :root {
        min-height: 100%;
        color-scheme: ${({ theme }) => theme.mode};

        --font-sans: ${fontFamilies.base};
    }


    * {
        margin: 0;
        padding: 0;
        outline: none;
        font-family: "TT Satoshi", -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    }

    *,
    *::before,
    *::after {
        box-sizing: border-box;
    }

    a {
        text-decoration: none;
        cursor: pointer;
    }

`;
