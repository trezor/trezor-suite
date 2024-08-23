import { createGlobalStyle } from 'styled-components';

import { typography } from '@trezor/theme';
import type { SuiteThemeColors } from '@trezor/components';

export const GlobalStyle = createGlobalStyle<{ theme: SuiteThemeColors }>`
    #app {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow-y: hidden;
    }

    input, textarea {
        outline: none;
    }

    body, html {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        ${typography.body}
        height: 100%;
        overflow-y: hidden;

        /* BlinkMacSystemFont, which is macOS Chrome/Electron suggested fallback font, breaks emojis (e.g. in Guide) so we omit it */
        font-family: "TT Satoshi", -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    }

    a {
        text-decoration: none;
        cursor: pointer;
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

    :root {
        color-scheme: ${({ theme }) => (theme.legacy.THEME === 'light' ? 'light' : 'dark')};
    }
`;
