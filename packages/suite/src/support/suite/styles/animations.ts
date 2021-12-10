import { keyframes } from 'styled-components';

// TODO: check that these styles are used

const STEP_ANIMATION_DURATION = 500;

const animationStyles = `
    .slide-left-enter {
        transform: translate(100%);
        pointer-events: none;
    }

    .slide-left-enter.slide-left-enter-active {
        transform: translate(0%);
        transition: transform 300ms ease-in-out;
    }

    .slide-left-exit {
        transform: translate(-100%);
    }

    .slide-left-exit.slide-left-exit-active {
        transform: translate(0%);
        transition: transform 300ms ease-in-out;
    }

    .slide-right-enter {
        transform: translate(-100%);
        pointer-events: none;
    }

    .slide-right-enter.slide-right-enter-active {
        transform: translate(0%);
        transition: transform 300ms ease-in-out;
    }

    .slide-right-exit {
        transform: translate(-100%);
    }

    .slide-right-exit.slide-right-exit-active {
        transform: translate(-200%);
        transition: transform 300ms ease-in-out;
    }

    .step-transition-enter {
        opacity: 0;
        transform: translateX(+20%);
        position: absolute;
    }

    .step-transition-enter-active {
        opacity: 1;
        transform: translateX(0);
        transition: opacity ${STEP_ANIMATION_DURATION}ms cubic-bezier(1, -0.01, 1, -0.02),
            transform ${STEP_ANIMATION_DURATION}ms linear;
    }

    .step-transition-exit {
        opacity: 1;
        transform: translateX(0);
    }

    .step-transition-exit-active {
        opacity: 0;
        transform: translateX(-20%);
        transition: opacity ${STEP_ANIMATION_DURATION}ms cubic-bezier(0, 1.01, 0, 1),
            transform ${STEP_ANIMATION_DURATION}ms linear;
    }

    .fade-out-enter {
        opacity: 0;
    }

    .fade-out-enter-active {
        opacity: 1;
        transition: opacity 1s;
    }

    .fade-out-exit {
        opacity: 1;
    }

    .fade-out-exit-active {
        /* transform: translateY(-20%); */
        opacity: 0;
        transition: opacity 1s;
    }
`;

export const SHAKE = keyframes`
    10%, 90% {
        transform: translate3d(-1px, 0, 0);
    }
    
    20%, 80% {
        transform: translate3d(2px, 0, 0);
    }

    30%, 50%, 70% {
        transform: translate3d(-4px, 0, 0);
    }

    40%, 60% {
        transform: translate3d(4px, 0, 0);
    }
`;

export const PULSATE = keyframes`
    0%, 100% {
        opacity: 0.5;
    }
    50% {
        opacity: 1.0;
    }
`;

export default animationStyles;
