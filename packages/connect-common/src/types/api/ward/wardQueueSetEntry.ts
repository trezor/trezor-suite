import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../../params';

/**
 * Hold a WARD write on the device until a synced host can publish it.
 *
 * `identifier` and `value` are hex-encoded bytes, as every protobuf `bytes` field is here.
 *
 * The ack carries the keyed path and NOTHING ELSE: there is no leaf, no counter and no mac,
 * because the device could not pull, prove current state or derive a root. Nothing here is for
 * the caller to store except the path; the change reaches the host later, sealed, through
 * `WardFlushQueue`. Use `wardSetEntry` for a write that must apply now -- it requires a synced
 * session and refuses without one.
 */
export declare function wardQueueSetEntry(
    params: Params<PROTO.WardQueueSetEntry>,
): Response<PROTO.WardQueueSetAck>;
