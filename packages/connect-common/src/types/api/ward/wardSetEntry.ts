import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../../params';

/**
 * Create or replace the WARD entry for (app_id, identifier).
 *
 * `identifier` and `value` are hex-encoded bytes, as every protobuf `bytes` field is here.
 *
 * The device answers a `WardLeafAck`, and there are TWO shapes of it. A synced session gets a
 * leaf plus `counter`/`mac`/`auth_commit`, which the caller MUST persist -- the device stores
 * nothing and a dropped result means the user confirmed a write that never happened. An
 * unsynced session gets `queued: true` and nothing else of substance: the device could not
 * pull, so it could not prove current state, derive a root or stamp a counter, and it held the
 * change in its own storage instead. A queued ack is not a leaf and must not be stored; the
 * change reaches the host later, sealed, through `WardFlushQueue`.
 */
export declare function wardSetEntry(
    params: Params<PROTO.WardSetEntry>,
): Response<PROTO.WardLeafAck>;
