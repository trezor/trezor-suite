import { versionUtils } from '@trezor/utils';

import { httpRequest } from '../../utils/assets';
import { isStrictFeatures } from '../../utils/firmwareUtils';
import { getInfo, GetInfoProps } from '../../data/firmwareInfo';

interface GetBinaryProps extends GetInfoProps {
    baseUrl: string;
    btcOnly?: boolean;
    version?: number[];
    intermediary?: boolean;
}

/**
 * Accepts version of firmware that is to be installed.
 * Also accepts features and releases list in order to validate that the provided version
 * is safe.
 * Ignores rollout (score)
 */
export const getBinary = async ({
    features,
    releases,
    baseUrl,
    version,
    btcOnly,
    intermediary = false,
}: GetBinaryProps) => {
    if (!isStrictFeatures(features)) {
        throw new Error('Features of unexpected shape provided');
    }

    if (intermediary && features.major_version !== 2) {
        const fw = await httpRequest(`${baseUrl}/firmware/1/trezor-inter-1.10.0.bin`, 'binary');
        return { binary: fw };
    }

    // we get info here again, but only as a sanity check.
    const infoByBootloader = getInfo({ features, releases });
    const releaseByFirmware = releases.find(
        r =>
            version &&
            versionUtils.isVersionArray(version) &&
            versionUtils.isEqual(r.version, version),
    );

    if (!infoByBootloader || !releaseByFirmware) {
        throw new Error('no firmware found for this device');
    }

    if (btcOnly && !releaseByFirmware.url_bitcoinonly) {
        throw new Error(`firmware version ${version} does not exist in btc only variant`);
    }

    // it is better to be defensive and not allow user update rather than let him wipe his seed
    // in case of improper update
    if (!versionUtils.isEqual(releaseByFirmware.version, infoByBootloader.release.version)) {
        throw new Error(
            'version provided as param does not match firmware version found by features in bootloader',
        );
    }
    const fw = await httpRequest(
        `${baseUrl}/${btcOnly ? releaseByFirmware.url_bitcoinonly : releaseByFirmware.url}`,
        'binary',
    );
    return {
        ...infoByBootloader,
        binary: fw,
    };
};
