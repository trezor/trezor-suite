import animations from './animations';
import tooltips from './tooltips';
import { variables, SuiteThemeColors } from '@trezor/components';
import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle<{ theme: SuiteThemeColors }>`
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
        background: ${props => props.theme.BG_GREY};
        font-size: ${variables.FONT_SIZE.NORMAL};
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        height: 100%;
        overflow-y: hidden;

        /* BlinkMacSystemFont, which is macOS Chrome/Electron suggested fallback font, breaks emojis (e.g. in Guide) so we omit it */
        font-family: "TT Hoves", -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    }

    a {
        text-decoration: none;
        cursor: pointer;
    }

    * {
        margin: 0;
        padding: 0;
        outline: none;
        font-family: "TT Hoves", -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    }

    *,
    *:before,
    *:after {
        box-sizing: border-box;
    }

    :root {
        color-scheme: ${props => (props.theme.THEME === 'light' ? 'light' : 'dark')};
    }

    ${animations}
    ${tooltips}
`;

export default GlobalStyle;
