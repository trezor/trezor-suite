import React from 'react';
import styled from 'styled-components';
import { TrezorDevice } from '@suite-types';
import { getFormattedFingerprint } from '@firmware-utils';
import { getFirmwareRelease } from '@suite-utils/device';

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
    // device.firmwareRelease should be always defined here (this renders upon dispatching ButtonRequest_FirmwareCheck)
    const { fingerprint } = getFirmwareRelease(device)!;
    const formattedFingerprint = getFormattedFingerprint(fingerprint);

    return <Wrapper>{formattedFingerprint}</Wrapper>;
};
