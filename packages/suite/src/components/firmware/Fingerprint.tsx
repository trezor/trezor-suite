import styled from 'styled-components';
import { colors } from '@trezor/components';

const Fingerprint = styled.pre`
    padding: 20px;
    width: 100%;
    overflow: auto;
    background-color: ${colors.BLACK96};
    color: ${colors.BLACK0};
    text-align: center;
    word-break: break-all;
    font-family: monospace;
`;

export default Fingerprint;
