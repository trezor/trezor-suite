import { variables } from '@trezor/components';

export default `
    #__next {
        display: flex;
        flex-direction: column;
        min-height: 100%;
    }

    input, textarea {
        outline: none;
    }

    body, html {
      background: #EFEFEF;
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

`;
