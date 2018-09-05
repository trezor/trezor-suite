import { injectGlobal } from 'styled-components';

import normalize from 'styled-normalize';

const baseStyles = () => injectGlobal`
    ${normalize};

    html, body {
        width: 100%;
        height: 100%;
        position: relative;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif;
        font-weight: 400;
        font-size: 14px;
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

    /* 
        custom Roboto with Zero without the thing inside, so it's more readable as number
        since 0 doesn't look too similar to 8
    */

    @font-face {
        font-family: 'Roboto Zero';
        src: url('./fonts/roboto/RobotoZero.eot') format('embedded-opentype'),
            url('./fonts/roboto/RobotoZero.eot?#iefix') format('embedded-opentype'),
            url('./fonts/roboto/RobotoZero.woff') format('woff'),
            url('./fonts/roboto/RobotoZero.ttf') format('truetype');
    }

    @font-face {
        font-family: 'Roboto Mono';
        font-style: normal;
        src: url('./fonts/roboto/roboto-mono-v4-greek_cyrillic-ext_greek-ext_latin_cyrillic_vietnamese_latin-ext-regular.eot') format('embedded-opentype'), /* IE9 Compat Modes */
            url('./fonts/roboto/roboto-mono-v4-greek_cyrillic-ext_greek-ext_latin_cyrillic_vietnamese_latin-ext-regular.eot?#iefix') format('embedded-opentype'), /* IE6-IE8 */
            url('./fonts/roboto/roboto-mono-v4-greek_cyrillic-ext_greek-ext_latin_cyrillic_vietnamese_latin-ext-regular.woff2') format('woff2'), /* Super Modern Browsers */
            url('./fonts/roboto/roboto-mono-v4-greek_cyrillic-ext_greek-ext_latin_cyrillic_vietnamese_latin-ext-regular.woff') format('woff'), /* Modern Browsers */
            url('./fonts/roboto/roboto-mono-v4-greek_cyrillic-ext_greek-ext_latin_cyrillic_vietnamese_latin-ext-regular.ttf') format('truetype'), /* Safari, Android, iOS */
            url('./fonts/roboto/roboto-mono-v4-greek_cyrillic-ext_greek-ext_latin_cyrillic_vietnamese_latin-ext-regular.svg#RobotoMono') format('svg'); /* Legacy iOS */
    }

`;

export default baseStyles;