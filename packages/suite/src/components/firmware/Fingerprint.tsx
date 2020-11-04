import styled from 'styled-components';

export const Fingerprint = styled.pre`
    padding: 8px;
    width: 100%;
    overflow: hidden;
    background-color: ${props => props.theme.BG_GREY};
    color: ${props => props.theme.TYPE_DARK_GREY};
    text-align: center;
    word-break: break-all;
    font-family: monospace;
`;
