import { Text } from '@trezor/components';

import { type TrezorDevice } from 'src/types/suite';
import { getFormattedFingerprint } from 'src/utils/firmware';

type FingerprintProps = {
    device: TrezorDevice;
};

export const Fingerprint = ({ device }: FingerprintProps) => {
    const { fingerprint } = device.firmwareReleaseConfigInfo?.release ?? {};

    if (!fingerprint) {
        // device.firmwareReleaseConfigInfo should be always defined here (this renders upon dispatching ButtonRequest_FirmwareCheck)
        console.error('Fingerprint is not defined in device.firmwareReleaseConfigInfo.release');

        return null;
    }

    const formattedFingerprint = getFormattedFingerprint(fingerprint);

    return (
        <Text isMonospaced as="pre" align="center">
            {formattedFingerprint}
        </Text>
    );
};
