import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../../params';

/**
 * Create or replace the WARD entry for (app_id, identifier).
 *
 * `identifier` and `value` are hex-encoded bytes, as every protobuf `bytes` field is here.
 *
 * REQUIRES A SYNCED SESSION and fails without one. To hold a change on the device instead, call
 * `wardQueueSetEntry`; that is a different request with a different ack, so "did this apply?" is
 * never a question about hidden session state.
 *
 * TWO POSSIBLE ACKS, AND THE `type` SAYS WHICH -- which is why this resolves to `{ type, message }`
 * rather than to a message alone. Which one arrives depends on how the DEVICE was built, and a
 * firmware deliberately does not report that, so a caller has to handle both:
 *
 *   `WardLeafAck`           WARD is served over this connection. The message is a leaf plus
 *                          `counter`/`mac`/`auth_commit`, and the caller MUST persist it -- the
 *                          device stores nothing, so a dropped result means the user confirmed a
 *                          write that never happened.
 *
 *   `WardMutationApplied`   WARD is served over the device's own channel. The device has already
 *                          published the mutation and heard it attested; there is nothing to store,
 *                          and a copy kept here would be stale from the next write on. `entry_key`
 *                          and `counter` are the whole receipt.
 *
 * The caller of these operations is the WARD app -- the application the user reaches WARD through --
 * never a wallet sharing the connection.
 *
 * Branch on `type`, never on the fields: both payloads carry `entry_key` and `counter`, and the
 * difference between "store this leaf" and "there is no leaf" is exactly what the type carries.
 */
export declare function wardSetEntry(
    params: Params<PROTO.WardSetEntry>,
): Response<
    | { type: 'WardLeafAck'; message: PROTO.WardLeafAck }
    | { type: 'WardMutationApplied'; message: PROTO.WardMutationApplied }
>;
