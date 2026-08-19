import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../../params';

/**
 * Create or replace the WARD entry for (app_id, identifier).
 *
 * `identifier` and `value` are hex-encoded bytes, as every protobuf `bytes` field is here.
 *
 * REQUIRES A SYNCED SESSION and fails without one. The ack is a `WardLeafAck`: a leaf plus
 * `counter`/`mac`/`auth_commit`, which the caller MUST persist -- the device stores nothing and a
 * dropped result means the user confirmed a write that never happened. To hold a change on the
 * device instead, call `wardQueueSetEntry`; that is a different request with a different ack, so
 * "did this apply?" is never a question about hidden session state.
 */
export declare function wardSetEntry(
    params: Params<PROTO.WardSetEntry>,
): Response<PROTO.WardLeafAck>;
