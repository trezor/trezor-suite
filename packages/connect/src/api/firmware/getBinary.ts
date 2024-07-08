import { versionUtils } from '@trezor/utils';
import { httpRequest } from '../../utils/assets';
import { FirmwareRelease, IntermediaryVersion } from '../../types';

interface GetBinaryProps {
    baseUrl: string;
    btcOnly?: boolean;
    version?: number[];
    intermediaryVersion?: IntermediaryVersion;
    releases: FirmwareRelease[];
}

export const getBinary = ({
    releases,
    baseUrl,
    version,
    btcOnly,
    intermediaryVersion,
}: GetBinaryProps) => {
    if (intermediaryVersion) {
        return httpRequest(
            `${baseUrl}/firmware/t1b1/trezor-t1b1-inter-v${intermediaryVersion}.bin`,
            'binary',
        );
    }

    const releaseByFirmware = releases.find(
        r =>
            version &&
            versionUtils.isVersionArray(version) &&
            versionUtils.isEqual(r.version, version),
    );

    if (releaseByFirmware === undefined) {
        throw new Error('no firmware found for this device');
    }

    const fwUrl = releaseByFirmware[btcOnly ? 'url_bitcoinonly' : 'url'];
    const url = `${baseUrl}/${fwUrl}`;

    return httpRequest(url, 'binary');
};
