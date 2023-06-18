import React from 'react';
import styled from 'styled-components';
import { TrezorDevice } from 'src/types/suite';
import { getFormattedFingerprint } from 'src/utils/firmware';

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

type FingerprintProps = {
    device: TrezorDevice;
};

export const Fingerprint = ({ device }: FingerprintProps) => {
    const { fingerprint } = device.firmwareRelease?.release ?? {};

    if (!fingerprint) {
        // device.firmwareRelease should be always defined here (this renders upon dispatching ButtonRequest_FirmwareCheck)
        console.error('Fingerprint is not defined in device.firmwareRelease.release');
        return null;
    }

    const formattedFingerprint = getFormattedFingerprint(fingerprint);

    return <Wrapper>{formattedFingerprint}</Wrapper>;
};
