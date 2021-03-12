import React from 'react';
import styled from 'styled-components';
import { TrezorDevice } from '@suite-types';
import { getFormattedFingerprint } from '@firmware-utils';

const Wrapper = styled.pre`
    padding: 8px;
    width: 100%;
    overflow: hidden;
    background-color: ${props => props.theme.BG_GREY};
    color: ${props => props.theme.TYPE_DARK_GREY};
    text-align: center;
    word-break: break-all;
    font-family: monospace;
`;

const Fingerprint = ({ device }: { device: TrezorDevice }) => (
    <Wrapper>
        {/* device.firmwareRelease should be always defined here (this renders upon dispatching ButtonRequest_FirmwareCheck) */}
        {getFormattedFingerprint(device.firmwareRelease!.release.fingerprint)}
    </Wrapper>
);

export { Fingerprint };
