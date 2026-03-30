import { TypedError } from '@trezor/connect-common/src/constants/errors';
import type { Log } from '@trezor/connect-common/src/utils/debug';
import { PROTOCOL_MALFORMED } from '@trezor/protocol/src/errors';
import { TRANSPORT_ERROR } from '@trezor/transport';
import { resolveAfter, versionUtils } from '@trezor/utils';

import type { WorkflowContext } from '../../types/workflow';

const CANCEL_TIMEOUT = 1_000;
const ATTEMPTS_LIMIT = 10;

type Context = {
    device: WorkflowContext['device'];
    signal: AbortSignal;
    logger?: Log;
};

const isLegacyBridge = (transport: Context['device']['transport']) =>
    transport.name === 'BridgeTransport' &&
    !versionUtils.isNewerOrEqual(transport.version, '3.0.0');

// note 1: clear communication with the device using Cancel message. This causes any remaining messages in its transport stack to get flushed.
//         this case may happen when communication with the device was abruptly interrupted by unloading connect unexpectedly (example window reload)
// note 2: this problem should not occur for the upcoming trezor host protocol, so we limit this to v1 and bridge protocols
// note 3: in 99% of cases we send this message unnecessarily. as @Szymon pointed out, it might be better to catch this call and repeat it.
// note 4: this case can happen also in the 'if' branch. 1] reload app, 2], browser doesn't fire release in time, 3] you get unacquired device, 4] you click
//         the 'use device here' button and here you go. Yet I didn't want to burden every TrezorConnect method call with this but we may reconsider this.
// note 5: ad note 4. it is not so problematic anymore since cleanup on dispose has been improved in https://github.com/trezor/trezor-suite/pull/16930
// note 6: T1 with older bootloader (1.8.0) doesn't respond to Cancel message, so we better ignore those
export const handshakeCancel = async ({ device, logger, signal }: Context) => {
    // device handshake already done
    if (device.features || device.getThpState()?.properties) {
        return;
    }

    const timeout = device.possibleT1 ? CANCEL_TIMEOUT : undefined;

    logger?.debug('handshake Cancel start');

    // send could fail on T1 bootloader when device has erase/wipe button request displayed
    const send = await device.getCurrentSession().send('Cancel', {}, { signal, timeout });

    if (!send.success) {
        logger?.debug(`handshake Cancel send error ${send.error}`);

        return;
    }

    logger?.debug('handshake Cancel sent');

    // try to read until receive some meaningful decoded message, timeout or attempts limit reached
    for (let attempt = 0; attempt < ATTEMPTS_LIMIT; ++attempt) {
        logger?.debug(`handshake Cancel read attempt ${attempt}`);

        const result = await device
            .getCurrentSession()
            .receive({ signal, timeout: CANCEL_TIMEOUT });

        // Older T1 don't respond to Cancel message which seems to be recoverable only by reacquiring
        if (!result.success && result.error.message === TRANSPORT_ERROR.ABORTED_BY_TIMEOUT) {
            // On trezord, session is lost when request is aborted from outside, so we should wait
            // for the session change before we reacquire
            if (isLegacyBridge(device.transport)) {
                await resolveAfter(501);
            }
            await device.acquire();
        }

        // Malformed protocol is thrown if received chunk:
        // 1. is empty message (empty buffer)
        // 2. has invalid protocol header
        // 3. it is a continuation packet
        // 4. message could not be encoded for some other reason (for example: missing definitions)
        if (!result.success && result.error.message !== PROTOCOL_MALFORMED) {
            logger?.debug(`handshake Cancel read error: ${result.error}`);

            // in any other case stop reading
            return;
        } else if (result.success) {
            logger?.debug(`handshake Cancel read success: ${result.payload.type}`);
            if (
                result.payload.type === 'Failure' &&
                result.payload.message.code === 'Failure_InvalidProtocol'
            ) {
                logger?.debug(`handshake Cancel protocol v2 detected`);
                await device.setupThp();
            }

            if (
                result.payload.type === 'Failure' &&
                result.payload.message.code === 'Failure_Busy'
            ) {
                throw TypedError(result.payload.message.code, result.payload.message.message);
            }

            return;
        }
    }

    logger?.debug(`handshake Cancel attempts limit reached`);
};
