import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../../params';

/**
 * Retire the pinned WARD app, so the next app to make a WARD request may claim the role.
 *
 * The device pins the first host to send a user-facing WARD message, on a held confirmation, and
 * refuses every other host from then on -- one party operates WARD per device, chosen by the user.
 * This undoes that choice, and it is the only WARD call that does not itself require the role: the
 * reason to make it is that the app holding the role can no longer ask.
 *
 * The device holds to confirm, because the request proves only that its sender is some paired host.
 * Nothing is discarded -- every entry, queued change and root survives.
 *
 * `was_bound` reports whether a pin was actually retired. Success alone does not say so: a device
 * nobody had claimed answers just as happily.
 */
export declare function wardResetApp(
    params?: Params<PROTO.WardResetApp>,
): Response<PROTO.WardResetAppAck>;
