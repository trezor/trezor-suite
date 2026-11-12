import { type DefaultTheme, createGlobalStyle } from 'styled-components';

import { fontFamilies, typography } from '@trezor/theme';

import animations from './animations';

const SEARCH_MATCH_COLOR = '#ffff00';
const SEARCH_CURRENT_MATCH_COLOR = '#ff9632';

const searchHighlightShadow = (color: string) =>
    ['1px 0', '-1px 0', '0 1px', '0 -1px', '1px 1px', '-1px 1px', '1px -1px', '-1px -1px']
        .map(offset => `${offset} 0 ${color}`)
        .join(', ');

const GlobalStyle = createGlobalStyle<{ theme: DefaultTheme }>`
    :root {
        --font-sans: ${fontFamilies.base};
        color-scheme: ${({ theme }) => (theme.mode === 'light' ? 'light' : 'dark')};
    }

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
        background: ${({ theme }) => theme.surfaceFillPage};
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        ${typography['body-md']}
        color: ${({ theme }) => theme.contentPrimary};
        height: 100%;
        overflow-y: hidden;

        /* BlinkMacSystemFont, which is macOS Chrome/Electron suggested fallback font, breaks emojis (e.g. in Guide) so we omit it */
        font-family: var(--font-sans);
    }

    a {
        text-decoration: none;
        cursor: pointer;
    }

    * {
        margin: 0;
        padding: 0;
        outline: none;
        font-family: var(--font-sans);
    }

    *,
    *::before,
    *::after {
        box-sizing: border-box;
    }

    ${animations}
    /* https://floating-ui.com/docs/misc#handling-large-content */
    .floating {
        max-width: calc(100vw - 10px);
    }

    /* Find highlights cannot take padding, so the same color extends 1px past the glyphs. */
    ::search-text {
        background-color: ${SEARCH_MATCH_COLOR};
        color: #000;
        text-shadow: ${searchHighlightShadow(SEARCH_MATCH_COLOR)};
    }

    ::search-text:current {
        background-color: ${SEARCH_CURRENT_MATCH_COLOR};
        color: #000;
        text-shadow: ${searchHighlightShadow(SEARCH_CURRENT_MATCH_COLOR)};
    }
`;

export default GlobalStyle;
