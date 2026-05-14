import { createGlobalStyle } from 'styled-components';

import {
    FIND_HIGHLIGHT_SELECTOR,
    MARK_HIGHLIGHT_PULSE_SELECTOR,
} from 'src/components/suite/FindBar/consts';

export const GlobalStyle = createGlobalStyle`

    ${FIND_HIGHLIGHT_SELECTOR} {
        position: relative;
        background: yellow;
        color: black;
        border-radius: 2px;
        transition: transform 0.16s ease, background 0.16s ease;
    }

    ${FIND_HIGHLIGHT_SELECTOR}[data-active='true'] {
        background: orange;
        transform: scale(1.05);
    }

    ${FIND_HIGHLIGHT_SELECTOR} ${MARK_HIGHLIGHT_PULSE_SELECTOR} {
        position: absolute;
        inset: -3px;
        border-radius: inherit;
        background: orange;
        opacity: 0.7;
        transform: scale(1);
        pointer-events: none;
        z-index: -1;
    }
`;
