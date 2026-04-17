import { type TrezorDevice } from '@suite-common/suite-types';
import { Text } from '@trezor/components';

import { getFormattedFingerprint } from './firmwareUtils';

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
