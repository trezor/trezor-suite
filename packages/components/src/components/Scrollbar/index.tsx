import { css } from 'styled-components';

// For nice scrollbars in Chrome put these styles in the global stylesheet.
// For Firefox you need to apply `scrollbar-color` prop on per element basis
const scrollbarStyles = css`
    ::-webkit-scrollbar {
        background-color: transparent;
        width: 10px;
    }

    /* background of the scrollbar except button or resizer */
    ::-webkit-scrollbar-track {
        background-color: transparent;
    }

    /* scrollbar itself */
    ::-webkit-scrollbar-thumb {
        /* 7F7F7F for mac-like color */
        background-color: ${props => props.theme.SCROLLBAR_THUMB};
        border-radius: 10px;
        border: 2px solid ${props => props.theme.BG_WHITE};
    }
    /* set button(top and bottom of the scrollbar) */
    ::-webkit-scrollbar-button {
        display: none;
    }

    /* firefox, first one is thumb, second color is track */
    scrollbar-color: ${props => props.theme.SCROLLBAR_THUMB} transparent;
`;

export { scrollbarStyles };
