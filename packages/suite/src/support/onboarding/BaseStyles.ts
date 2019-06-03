import { createGlobalStyle } from 'styled-components';
import reset from 'styled-reset';
import { STEP_ANIMATION_DURATION } from '@suite/constants/onboarding/constants';

const baseStyles = createGlobalStyle`
    ${reset}
    html, body {
        width: 100%;
        height: 100%;
        position: relative;
        font-family: 'Roboto', sans-serif;
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

    /* classes required by react transitions https://github.com/reactjs/react-transition-group */
    .step-transition-enter {
        opacity: 0;
        transform: translateX(+20%);
        position: absolute;
    }

    .step-transition-enter-active {
        opacity: 1;
        transform: translateX(0);
        transition: opacity ${STEP_ANIMATION_DURATION}ms cubic-bezier(1,-0.01,1,-0.02), transform ${STEP_ANIMATION_DURATION}ms linear;
    }

    .step-transition-exit {
        opacity: 1;
        transform: translateX(0);
    }

    .step-transition-exit-active {
        opacity: 0;
        transform: translateX(-20%);
        transition: opacity ${STEP_ANIMATION_DURATION}ms cubic-bezier(0,1.01,0,1), transform ${STEP_ANIMATION_DURATION}ms linear;
    }
`;

export default baseStyles;
