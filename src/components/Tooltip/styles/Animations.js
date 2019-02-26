import { css } from 'styled-components';

const animationStyles = css`
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
`;

export default animationStyles;