import { isDeviceKnown } from '@suite-common/suite-utils';
import {
    type Device,
    type FirmwareHashCheckError,
    type FirmwareRevisionCheckError,
} from '@trezor/connect';

type FirmwareAuthenticityCheckErrors = {
    revisionCheckError: FirmwareRevisionCheckError | null;
    hashCheckError: FirmwareHashCheckError | null;
};

export const getFirmwareAuthenticityCheckErrors = (
    device?: Device,
): FirmwareAuthenticityCheckErrors => {
    const checks = isDeviceKnown(device) ? device.authenticityChecks : null;

    const revisionCheckResult = checks?.firmwareRevision;
    const hashCheckResult = checks?.firmwareHash;

    return {
        revisionCheckError:
            revisionCheckResult?.success === false ? revisionCheckResult.error : null,
        hashCheckError: hashCheckResult?.success === false ? hashCheckResult.error : null,
    };
};
