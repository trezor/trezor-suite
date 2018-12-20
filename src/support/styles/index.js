import { createGlobalStyle } from 'styled-components';
import colors from 'config/colors';
import { FONT_WEIGHT } from 'config/variables';

import tooltipStyles from './Tooltip';
import animationStyles from './Animations';

const baseStyles = createGlobalStyle`
    html, body {
        width: 100%;
        height: 100%;
        position: relative;
        font-family: "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
        font-weight: ${FONT_WEIGHT.NORMAL};
        font-size: 14px;
        color: ${colors.TEXT};
    }

    * , *:before , *:after {
        box-sizing: border-box;
    }

    * {
        margin: 0;
        padding: 0;
    }

    *::selection, *::-moz-selection, *:focus, *:active, *:active:focus,  {
        outline: 0 !important;
        -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    }

    a {
        text-decoration: none;
        cursor: pointer;
    }

    a:focus,
    button:focus,
    input:focus,
    textarea:focus {
        outline: 0;
    }

    #trezor-wallet-root {
        height: 100%;
    }

    ${animationStyles};
    ${tooltipStyles};
`;

export default baseStyles;
