import { DefaultTheme, createGlobalStyle } from 'styled-components';

import { typography } from '@trezor/theme';

import animations from './animations';
import { FIND_HIGHLIGHT_SELECTOR, MARK_HIGHLIGHT_PULSE_SELECTOR } from '../FindBar/consts';

const GlobalStyle = createGlobalStyle<{ theme: DefaultTheme }>`
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
        background: ${({ theme }) => theme.backgroundSurfaceElevation0};
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        ${typography.body}
        color: ${({ theme }) => theme.textDefault};
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

    ${animations}
    /* https://floating-ui.com/docs/misc#handling-large-content */
    .floating {
        max-width: calc(100vw - 10px);
    }

    ${FIND_HIGHLIGHT_SELECTOR} {
        position: relative;
        background: yellow;
        color: black;
        border-radius: 2px;
        transition: transform 0.16s ease, background 0.16s ease;
    }

    ${FIND_HIGHLIGHT_SELECTOR}[data-active='true'] {
        background: orange;
        transform: scale(1.05);
    }

    ${FIND_HIGHLIGHT_SELECTOR} ${MARK_HIGHLIGHT_PULSE_SELECTOR} {
        position: absolute;
        inset: -3px;
        border-radius: inherit;
        background: orange;
        opacity: 0.7;
        transform: scale(1);
        pointer-events: none;
        z-index: -1;
    }
`;

export default GlobalStyle;
