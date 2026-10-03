import type { WardProvider } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import type { Logger } from '@trezor/utils';

/**
 * The provider Core registers when the host supplied none.
 *
 * A device that pulls mid-call is waiting on the wire, so "no provider" cannot be answered
 * with silence: the stub fails the pull immediately, which surfaces the missing registration
 * as an error on the call instead of a stalled device. It is also the seam a real provider
 * replaces -- nothing else in connect needs to change when it does.
 */
export const createWardProviderStub = (logger: Logger): WardProvider => ({
    serveEntry: () => {
        // Never log the request. Its `entry_key` (and `staged.entry_key` in a batched flush) is
        // derived from the passphrase-dependent K_path, so it is a stable per-wallet identifier,
        // and the connect logger can leave the device. Only the refusal itself is recorded.
        logger.debug('ward provider stub: WardEntryRequest refused, no wardProvider registered');

        throw ERRORS.TypedError('Runtime', 'wardProvider.serveEntry is not implemented');
    },
});
