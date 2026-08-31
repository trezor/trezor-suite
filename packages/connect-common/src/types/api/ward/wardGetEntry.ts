import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../../params';

/**
 * Ask the device to SHOW the WARD entry for (app_id, identifier).
 *
 * `identifier` is hex-encoded bytes, as every protobuf `bytes` field is here.
 *
 * THE VALUE IS NOT RETURNED, and the ack says as much: `Success` and nothing else. The device
 * displays what it read and keeps it -- handing a verified value back to the calling application
 * is a different security model, and it collides with unattended use, since every read costs a
 * confirmation. So this is a request to show a person something, not a way to obtain it.
 *
 * ONLINE ONLY, and the device refuses without a synced session rather than falling back to its own
 * copy: a host that could turn a failed pull into a local read could choose which of the two the
 * user sees. Reading what the device holds is a separate call -- `wardQueueGetEntry`.
 *
 * WHERE THE DEVICE PULLS FROM IS NOT THIS CALLER'S BUSINESS. On an ordinary build the pull comes
 * back to this host as a `WardEntryRequest`, answered from the registered `wardProvider`; on a
 * build that serves WARD over a dedicated interface the device asks its daemon and this host sees
 * nothing but the answer. The request is identical either way.
 */
export declare function wardGetEntry(params: Params<PROTO.WardGetEntry>): Response<PROTO.Success>;
