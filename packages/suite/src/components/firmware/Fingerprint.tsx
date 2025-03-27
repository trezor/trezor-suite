import { Text } from '@trezor/components';

import { TrezorDevice } from 'src/types/suite';
import { getFormattedFingerprint } from 'src/utils/firmware';

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

    return (
        <Text isMonospaced as="pre" align="center">
            {formattedFingerprint}
        </Text>
    );
};
