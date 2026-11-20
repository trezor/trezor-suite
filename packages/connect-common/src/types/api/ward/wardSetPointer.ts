import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../../params';

/**
 * Make (app_id, identifier) a pointer to (app_id, target_identifier). A read of the pointer returns
 * the target's value, followed one hop by the device.
 *
 * `identifier` and `target_identifier` are hex-encoded bytes. Requires a synced session. Resolves
 * to `{ type, message }` exactly as `wardSetEntry`: persist a `WardLeafAck`; a
 * `WardMutationApplied` is the whole receipt.
 */
export declare function wardSetPointer(
    params: Params<PROTO.WardSetPointer>,
): Response<
    | { type: 'WardLeafAck'; message: PROTO.WardLeafAck }
    | { type: 'WardMutationApplied'; message: PROTO.WardMutationApplied }
>;
