import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../../params';

/**
 * Export what the device holds for (app_id, identifier), so it can be backed up.
 *
 * `identifier` is hex-encoded bytes, as every protobuf `bytes` field is here.
 *
 * The ack says which case it was (`missing`, `pending`) and carries the record itself. For a QUEUED
 * change it also carries `mac`, a MAC the device made over everything it would need to write the
 * change back -- keep the whole ack and hand it to `wardQueueSetEntry` to restore it. A PINNED copy
 * comes back without a MAC: WARD already holds that value, so there is no intent to re-queue and
 * nothing to restore.
 *
 * A record the device cannot read FAILS the call rather than coming back flagged: "there is
 * something here I cannot vouch for" must not be reported as "nothing here".
 */
export declare function wardQueueGetEntry(
    params: Params<PROTO.WardQueueGetEntry>,
): Response<PROTO.WardQueueGetAck>;
