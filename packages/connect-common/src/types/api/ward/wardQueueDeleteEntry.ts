import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../../params';

/**
 * Discard a queued change on the device.
 *
 * `identifier` is hex-encoded bytes, as every protobuf `bytes` field is here.
 *
 * The WARD entry itself is untouched -- this removes a change that was never published, and
 * `wardSetEntry` remains the way to write the tree. Pending records only: a pinned copy at the same
 * path is reported as `missing` and left alone.
 *
 * `missing: true` means nothing was queued there. That is an answer, not an error: a caller
 * reconciling its own view of the queue will ask about changes that have already been published.
 */
export declare function wardQueueDeleteEntry(
    params: Params<PROTO.WardQueueDeleteEntry>,
): Response<PROTO.WardQueueDeleteAck>;
