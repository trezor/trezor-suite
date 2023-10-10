import { keyframes } from 'styled-components';

export const FADE_IN = keyframes`
    0% {
        opacity: 0;
    }
    100% {
        opacity: 1;
    }
`;

export const DROPDOWN_MENU = keyframes`
    0% {
        opacity: 0;
        transform: translateY(-12px);
    }

    100% {
        opacity: 1;
        transform: translateY(0);
    }
`;
