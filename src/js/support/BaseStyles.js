import { injectGlobal } from 'styled-components';

import normalize from 'styled-normalize';

const baseStyles = () => injectGlobal`
    ${normalize};
    
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
        -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    }
`;

export default baseStyles;
