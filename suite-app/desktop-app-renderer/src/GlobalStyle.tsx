import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
    ::highlight(find-match) {
        background-color: yellow;
        color: black;
    }

    ::highlight(find-current) {
        background-color: orange;
        color: black;
    }
`;
