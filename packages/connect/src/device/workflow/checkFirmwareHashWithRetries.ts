import { isArrayMember } from '@trezor/utils';

import { checkFirmwareHash } from './checkFirmwareHash';
import { FIRMWARE } from '../../constants';
import type { IDevice } from '../../types/idevice';
import type { Log } from '../../utils/debug';

type Context = {
    device: IDevice;
    logger: Log;
};

const PROBE_CHECK_TIME_RETRIES = 4;

const probeCheckTime = async (context: Context) => {
    for (let i = 0; i < PROBE_CHECK_TIME_RETRIES; i++) {
        const result = await checkFirmwareHash(context);

        // The hash check itself on the device must take always the same time.
        // A delay can happen on the host side, so at least one good result means OK
        if (result !== null && (result.success || result.error !== 'takes-too-long')) {
            context.device.setAuthenticityChecks(result);

            return;
        }
    }
};

export const checkFirmwareHashWithRetries = async (context: Context): Promise<void> => {
    const lastResult = context.device.getAuthenticityChecks().firmwareHash;
    const notDoneYet = lastResult === null;
    const attemptsDone = lastResult?.attemptCount ?? 0;
    if (attemptsDone >= FIRMWARE.HASH_CHECK_MAX_ATTEMPTS) return;

    const wasError = lastResult !== null && !lastResult.success;
    const wasErrorRetriable =
        wasError && isArrayMember(lastResult.error, FIRMWARE.HASH_CHECK_RETRIABLE_ERRORS);
    const lastErrorPayload = wasError ? lastResult?.errorPayload : null;

    if (notDoneYet || wasErrorRetriable) {
        const result = await checkFirmwareHash(context);
        context.device.setAuthenticityChecks(result);

        if (result === null) return; // device was not acquired or was in bootloader mode, couldn't have performed the check
        result.attemptCount = attemptsDone + 1;

        if (!result.success && result.error === 'takes-too-long') {
            await probeCheckTime(context);
        }

        // if it succeeded only after a retry, and there was an `errorPayload` previously, we want to pass that information to suite
        if (result.success && lastErrorPayload) {
            result.warningPayload = { lastErrorPayload };
        }
    }
};
