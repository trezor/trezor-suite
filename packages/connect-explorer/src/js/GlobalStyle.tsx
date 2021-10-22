import { createGlobalStyle } from 'styled-components';
import { variables } from '@trezor/components';

const GlobalStyle = createGlobalStyle`
    * , *:before , *:after {
        box-sizing: border-box;
    }

    * {
        margin: 0;
        padding: 0;
    }

    *:focus, *:active, *:active:focus, *::selection, *::-moz-selection {
        outline: 0 !important;
        -webkit-appearance: none;
        -webkit-tap-highlight-color: rgba(0,0,0,0);
    }

    html, body {
        width: 100%;
        height: 100%;
    }

    html, body {
        position: relative;
        font-size: ${variables.FONT_SIZE.NORMAL};
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        font-family: "TT Hoves", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
        height: 100%;
        font-size: 14px;
        -webkit-font-smoothing: antialiased;
    }

    #root, .app-container {
        height: 100%;
    }
    
    a {
        text-decoration: none;
        cursor: pointer;
    }

    button:focus, input:focus, textarea:focus {
        outline: 0;
    }

`;

export default GlobalStyle;
