import styled from 'styled-components';
import { colors } from '@trezor/components';

export const Fingerprint = styled.pre`
    padding: 8px;
    width: 100%;
    overflow: hidden;
    background-color: ${colors.BLACK96};
    color: ${colors.BLACK0};
    text-align: center;
    word-break: break-all;
    font-family: monospace;
`;
