import { createGlobalStyle } from 'styled-components';

import { type SuiteThemeColors } from '@trezor/components/src/config/colors';
import { type ThemeVariant, fontFamilies, typography } from '@trezor/theme';

import animations from './animations';

type SuiteTheme = SuiteThemeColors & { variant: ThemeVariant };

const GlobalStyle = createGlobalStyle<{ theme: SuiteTheme }>`
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
        background: ${({ theme }) => theme.backgroundSurfaceElevation0};
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        ${typography['body-md']}
        color: ${({ theme }) => theme.textDefault};
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
`;

export default GlobalStyle;
