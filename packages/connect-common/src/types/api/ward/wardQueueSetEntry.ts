import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../../params';

/**
 * Hold a WARD write on the device until a synced host can publish it.
 *
 * `identifier` and `value` are hex-encoded bytes, as every protobuf `bytes` field is here.
 *
 * The ack is EMPTY: there is no leaf, no counter and no mac because none of them exists yet, and
 * not even the keyed path, which nothing needs until the change reaches the tree -- `WardFlushQueue`
 * returns it then. Use `wardSetEntry` for a write that must apply now; it requires a synced session
 * and refuses without one.
 *
 * PASSING `mac` MAKES THIS A RESTORE of a queued change the device exported for backup. Send back
 * exactly what the export contained, unchanged: the MAC covers these fields plus the path and key
 * space the device derives itself, and it is verified before anything is written or shown.
 */
export declare function wardQueueSetEntry(
    params: Params<PROTO.WardQueueSetEntry>,
): Response<PROTO.WardQueueSetAck>;
