import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../../params';

/**
 * Publish ONE change the device has been holding in its own queue.
 *
 * `identifier` is hex-encoded bytes, as every protobuf `bytes` field is here.
 *
 * REQUIRES A SYNCED SESSION. A queued change carries no path, no proof and no root -- it is an
 * intent, and the device re-derives it against current state on the way out, which it cannot do
 * without one.
 *
 * ONE PER CALL: loop while `remaining` is non-zero. There is no transaction to apply a batch under,
 * so one change per round trip is what bounds a partial application to a single retryable step. A
 * caller that ignores `remaining` publishes the first queued change and strands the rest.
 *
 * Pass `app_id` + `identifier` to publish THAT change; pass neither to publish whatever is next. A
 * COMPACT record can only be published by name -- it keeps a hash of its identity, and the device
 * cannot turn a hash back into a keyed path -- and the device says so rather than skipping it.
 *
 * TWO POSSIBLE ACKS, AND THE `type` SAYS WHICH, as `wardSetEntry`: `WardFlushQueueAck` carries a
 * leaf the caller must store, because on that build the WARD app owns the replica;
 * `WardFlushQueueApplied` is the receipt from a device that serves WARD over its own channel and has
 * already published there. Both carry `remaining`.
 */
export declare function wardFlushQueue(
    params: Params<PROTO.WardFlushQueue>,
): Response<
    | { type: 'WardFlushQueueAck'; message: PROTO.WardFlushQueueAck }
    | { type: 'WardFlushQueueApplied'; message: PROTO.WardFlushQueueApplied }
>;
