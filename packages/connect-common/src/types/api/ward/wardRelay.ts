import { type Static, Type } from '@trezor/schema-utils';

import type { Params, Response } from '../../params';

/**
 * Hand the device to `wardd`, the local WARD service, for one conversation.
 *
 * wardd holds the wallet's replica and drives the device through a whole WARD operation; this call
 * carries the messages between the two on the device's current session. Pulls go to wardd, not to
 * the registered `wardProvider` -- they are its conversation -- while button requests, PIN and
 * passphrase are handled as for any other call.
 *
 * - `sync`: bring the device to the WM's head. A device off the WM's history needs `rejoin: true`,
 *   which discards its changes above the fork and is confirmed on the device; without it wardd
 *   answers `needs_rejoin`.
 * - `flush`: publish everything the device holds in its queue -- one change per transition, or up
 *   to `maxBatch` folded into one -- syncing after each.
 * - `status`: the replica's head and the WM's, with no device involved.
 *
 * THE WALLET. `wardId` names it; when omitted the device is asked (`WardSync`). The replica is
 * owned by a child of the wallet's Evolu node: pass `evoluNode` if the host has it, or
 * `proof_of_delegated_identity` to have it fetched in this session (`EvoluGetNode`). A wardd
 * running in memory needs neither.
 *
 * `token` is wardd's pairing token; `url` defaults to `ws://127.0.0.1:21329`. wardd's refusals keep
 * their code in the message (`wardd needs_rejoin: ...`).
 */
export const WardRelay = Type.Object({
    url: Type.Optional(Type.String()),
    token: Type.String(),
    op: Type.Union([Type.Literal('sync'), Type.Literal('flush'), Type.Literal('status')]),
    rejoin: Type.Optional(Type.Boolean()),
    maxBatch: Type.Optional(Type.Number()),
    wardId: Type.Optional(Type.String()),
    evoluNode: Type.Optional(Type.String()),
    proof_of_delegated_identity: Type.Optional(Type.String()),
});
export type WardRelay = Static<typeof WardRelay>;

export declare function wardRelay(params: Params<WardRelay>): Response<Record<string, unknown>>;
