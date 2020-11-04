import animations from './animations';
import { notifications } from './notifications';
import {
    variables,
    tooltipGlobalStyles,
    SuiteThemeColors,
    scrollbarStyles,
} from '@trezor/components';
import { createGlobalStyle } from 'styled-components';

const globalStyles = createGlobalStyle<{ theme: SuiteThemeColors }>`
    #__next {
        display: flex;
        flex-direction: column;
        min-height: 100%;
    }

    input, textarea {
        outline: none;
    }

    body, html {
      background: ${props => props.theme.BG_GREY};
      font-size: ${variables.FONT_SIZE.NORMAL};
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      font-family: "TT Hoves", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      height: 100%;
    }

    a {
        text-decoration: none;
        cursor: pointer;
    }

    * {
        margin: 0;
        padding: 0;
        outline: none;
        font-family: "TT Hoves", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    }

    *,
    *:before,
    *:after {
        box-sizing: border-box;
    }

    ${animations}
    ${notifications}
    ${tooltipGlobalStyles}
    ${scrollbarStyles}
`;

export default globalStyles;
