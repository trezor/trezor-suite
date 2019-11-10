import { colors } from '@trezor/components';
import animations from './animations';

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
      background: ${colors.BACKGROUND};
      font-size: 14px;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      font-family: "TT Hoves", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    }

    a {
        text-decoration: none;
        cursor: pointer;
    }

    * {
        margin: 0;
        padding: 0;
        outline: none;
    }

    *,
    *:before,
    *:after {
        box-sizing: border-box;
    }

    ${animations}
`;
