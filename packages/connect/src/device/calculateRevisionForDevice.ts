import { isNewer } from '@trezor/utils/src/versionUtils';
import { VersionArray } from '../exports';

type calculateRevisionForDeviceParams = {
    commitRevision: string;
    version: VersionArray;
};

export const calculateRevisionForDevice = ({
    commitRevision,
    version,
}: calculateRevisionForDeviceParams): string => {
    if (isNewer(version, '2.4.0')) {
        return commitRevision;
    }

    if (isNewer(version, '2.3.0')) {
        return commitRevision.slice(0, 9);
    }

    if (isNewer(version, '2.1.8')) {
        // Official Firmware between '2.1.8' and '2.3.0' was not released.
        // For consistency it returns the hash, but it will fail the check anyway.
        return commitRevision;
    }

    if (isNewer(version, '2.0.0')) {
        return commitRevision.slice(0, 8);
    }

    return commitRevision; // For Trezor One
};
