import { FirmwareRelease } from '../types';
import { httpRequest } from '../utils/assets';
import { isValidReleases } from '../utils/firmwareUtils';

type DownloadReleasesMetadataParams = {
    internal_model: string;
};

export const downloadReleasesMetadata = async ({
    internal_model,
}: DownloadReleasesMetadataParams): Promise<FirmwareRelease[]> => {
    const url = `https://data.trezor.io/firmware/${internal_model.toLowerCase()}/releases.json`;

    const response = (await httpRequest(
        url,
        'json',
        { signal: AbortSignal.timeout(10000) },
        true, // skipLocalForceDownload=true
    )) as any;

    if (isValidReleases(response)) {
        return response;
    }

    return [] as FirmwareRelease[];
};
