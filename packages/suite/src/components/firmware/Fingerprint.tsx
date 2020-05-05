import styled from 'styled-components';
import { colors } from '@trezor/components';

const Fingerprint = styled.pre`
    padding: 20px;
    width: 100%;
    overflow: auto;
    background-color: ${colors.BLACK96};
    color: ${colors.BLACK0};
    text-align: left;
    word-break: break-all;
`;

export default Fingerprint;
