/**
 * WardSession — the WARD device-transport seam.
 *
 * OWNS: every `cmd.typedCall(...)` exchange of the WARD wire protocol (the sync
 * round, the queue/perform/confirm write round, lookup, list-pending) and the
 * pull-model proof-callback lifecycle. Method handlers drive WARD through this
 * object and never hand-roll `typedCall` sequences themselves.
 *
 * MUST NOT: resolve the host database, build/verify Merkle proofs, compute values,
 * or talk to the WARD Manager. Those belong to the app layer (`@trezor/ward/app`)
 * and the `WardManagerService` seam respectively. This class is pure transport:
 * request in, device ack out.
 *
 * SEAM: the fixed WARD wire round. New device-facing flows are added here as
 * methods, keeping handlers declarative.
 */
import { bytesToHex } from '@noble/hashes/utils.js';

import { ERRORS } from '@trezor/connect-common/src/constants';
import type { MessagesSchema as Messages } from '@trezor/protobuf';
import type { LeafPart } from '@trezor/ward';

import { readLeafContent, readLeafIdentity } from './leafContent';
import type { DeviceCommands } from '../../device/DeviceCommands';

type Cmd = ReturnType<typeof DeviceCommands>;
type Vlog = (...m: unknown[]) => void;

const utf8Hex = (s: string) => bytesToHex(new TextEncoder().encode(s));
const noop: Vlog = () => {};

/** The freshness head (WM_HEAD) the WM attests: a counter + optional root MAC. */
export type WardHead = { counter: number; mac?: string };

/** Result of a completed sync round (WARDSync). */
export type WardSyncResult = {
    nonce: string;
    version: number;
    wardId?: string;
};

/** Installed authenticated state after adopt / confirm (WARDReconcile / WARDConfirmedByWMAck). */
export type WardInstalled = {
    counter: number;
    root?: string;
    rootMac?: string;
};

/** The authorized candidate returned by perform (WARDPerformUpdateAck). Includes the
 * device-produced leaf — BOTH parts — which the host must store because it cannot
 * encode a sealed part itself. `entryKey` is the LeafIdentityMAC and becomes the
 * record's key; `keyType` is clear (it selects both keys). */
export type WardCandidate = {
    counter: number;
    root?: string;
    mac?: string;
    wardId?: string;
    entryKey?: string;
    keyType?: string;
    identity?: LeafPart;
    content?: LeafPart;
};

/**
 * The wire decoder yields `null` for an absent optional field, while the
 * `...(x !== undefined && { x })` spread guards used when BUILDING messages only
 * suppress `undefined` -- so a decoded `null` would be forwarded and the encoder throws
 * ("must be of type string ... Received null"). That is exactly what a DELETE that
 * empties the tree produces: WARDPerformUpdateAck comes back with new_root = null and
 * mac = null. Normalize at the decode boundary so "absent" has one representation.
 */
const absent = <T>(v: T | null | undefined): T | undefined => (v == null ? undefined : v);

export class WardSession {
    private readonly cmd: Cmd;
    private readonly vlog: Vlog;

    constructor(cmd: Cmd, vlog: Vlog = noop) {
        this.cmd = cmd;
        this.vlog = vlog;
    }

    /** Begin a sync round: the device mints a nonce and echoes its identities. */
    async sync(): Promise<WardSyncResult> {
        this.vlog('-> WARDSync');
        const { message } = await this.cmd.typedCall('WARDSync', 'WARDSyncAck', {});
        this.vlog('<- WARDSyncAck', message);

        return {
            nonce: message.nonce,
            version: message.version,
            wardId: message.ward_id,
        };
    }

    /**
     * Adopt the WM-attested head against the host DB root: WARDIngestAttestation
     * (verify the WM signature + anti-rollback floor) then WARDReconcile (bind the
     * host root to the attested mac and install it). This is the sync-round tail
     * shared by wardInit and wardUpdate.
     */
    async adopt(head: WardHead & { wmSignature: string }, dbRoot?: string): Promise<WardInstalled> {
        this.vlog('-> WARDIngestAttestation');
        await this.cmd.typedCall('WARDIngestAttestation', 'WARDIngestAttestationAck', {
            counter: head.counter,
            ...(head.mac != null && { mac: head.mac }),
            wm_signature: head.wmSignature,
        });

        // FIXME(ward): firmware decides "attested empty tree" from the mac being ABSENT and
        // then requires the root to be absent too -- so the pair must be consistent. A
        // TreeState with a root but NO mac (mac is optional: "if the provider has one")
        // would be rejected by reconcile with the same DataError. Not enforced here: some
        // existing flows/fixtures carry exactly that combination, so validating it needs a
        // decision about whether root-without-mac is legal at all (gap 3).
        //
        // EMPTY TREE: the firmware contract is that an ABSENT mac means "attested empty
        // tree", and it then REQUIRES the root to be absent too ("attested tree is empty
        // but a root was supplied", service.py reconcile). The host's canonical empty root
        // is '' (computeRootFromBlobs([]) === ''), which is NOT absent on the wire -- an
        // empty `bytes` field still arrives as b"", so `root is not None` and the device
        // rejects the round. Every operation after a delete-to-empty hit this. Treat '' as
        // absent so both fields are omitted together and the two sides agree.
        this.vlog('-> WARDReconcile');
        const { message } = await this.cmd.typedCall('WARDReconcile', 'WARDReconcileAck', {
            ...(dbRoot != null && dbRoot !== '' && { root: dbRoot }),
        });
        this.vlog('<- WARDReconcileAck', message);

        return {
            counter: message.counter,
            root: absent(message.new_root),
            rootMac: absent(message.root_mac),
        };
    }

    /** Queue an edit INTENT (pull model): no proof, no counter. Returns the pending_id.
     * `appId` names the target domain; the device forms entry_key(appId, address). */
    async queue(
        appId: string,
        address: string,
        newValueHex: string,
    ): Promise<{ pendingId?: number }> {
        this.vlog('-> WARDQueueUpdate');
        const { message } = await this.cmd.typedCall('WARDQueueUpdate', 'WARDQueueUpdateAck', {
            address: utf8Hex(address),
            new_value: newValueHex,
            app_id: appId,
        });
        this.vlog('<- WARDQueueUpdateAck', message);

        return { pendingId: message.pending_id };
    }

    /**
     * Authorize a queued intent. The device DERIVES counter_T and PULLS the proof
     * on demand — answered by `proofAck` via the WARDProofRequest callback, which is
     * scoped to this call (set before, cleared in finally).
     */
    async perform(
        buildAck: (request: Messages.WARDProofRequest) => Messages.WARDProofAck,
        pendingId?: number,
    ): Promise<WardCandidate> {
        // The device pulls the proof by the opaque entry_key it computed; the host
        // answers reactively from its stored blobs (it can't compute entry_key).
        this.cmd.setWardProofCallback(request => {
            this.vlog('<- WARDProofRequest', request);

            return buildAck(request);
        });
        try {
            this.vlog('-> WARDPerformUpdate');
            const { message } = await this.cmd.typedCall(
                'WARDPerformUpdate',
                'WARDPerformUpdateAck',
                { ...(pendingId !== undefined && { pending_id: pendingId }) },
            );
            this.vlog('<- WARDPerformUpdateAck', message);

            return {
                counter: message.counter,
                // null-normalized: a delete that empties the tree returns new_root/mac null
                root: absent(message.new_root),
                mac: absent(message.mac),
                wardId: absent(message.ward_id),
                // The device is the encoder: store the leaf it returned, both parts. The
                // wire carries each part as a self-describing oneof; decode to LeafParts.
                // key_type rides on LeafIdentity (it selects both keys, so it is clear).
                entryKey: message.entry_key,
                keyType: readLeafIdentity(message.identity).keyType,
                identity: readLeafIdentity(message.identity).part,
                content: readLeafContent(message.content),
            };
        } finally {
            this.cmd.setWardProofCallback(undefined);
        }
    }

    /** Install the WM-signed candidate (WARDConfirmedByWM). Advances the device counter. */
    async confirm(args: {
        counter: number;
        mac?: string;
        wmSignature: string;
        pendingId?: number;
    }): Promise<WardInstalled> {
        this.vlog('-> WARDConfirmedByWM');
        const { message } = await this.cmd.typedCall('WARDConfirmedByWM', 'WARDConfirmedByWMAck', {
            counter: args.counter,
            ...(args.mac != null && { mac: args.mac }),
            wm_signature: args.wmSignature,
            ...(args.pendingId != null && { pending_id: args.pendingId }),
        });
        this.vlog('<- WARDConfirmedByWMAck', message);

        return {
            counter: message.counter,
            root: absent(message.new_root),
            rootMac: absent(message.root_mac),
        };
    }

    /**
     * Show an address with its WARD-authenticated label (PULL). The device runs
     * resolve_label, which emits a WARDProofRequest(address) that `proofAck` answers;
     * the device then renders the verified label on the trusted address screen.
     * Callback is scoped to this call (set before, cleared in finally), like perform().
     */
    async displayAddress(
        params: Messages.DisplayAddress,
        buildAck: (request: Messages.WARDProofRequest) => Messages.WARDProofAck,
    ): Promise<void> {
        this.cmd.setWardProofCallback(request => {
            this.vlog('<- WARDProofRequest', request);

            return buildAck(request);
        });
        try {
            this.vlog('-> DisplayAddress');
            await this.cmd.typedCall('DisplayAddress', 'Success', params);
            this.vlog('<- Success');
        } finally {
            this.cmd.setWardProofCallback(undefined);
        }
    }

    /** Abandon a queued/committed intent (e.g. a candidate that lost the WM CAS race). */
    async discardPending(pendingId?: number): Promise<void> {
        this.vlog('-> WARDDiscardPending');
        await this.cmd.typedCall('WARDDiscardPending', 'WARDDiscardPendingAck', {
            ...(pendingId !== undefined && { pending_id: pendingId }),
        });
    }

    /**
     * PULL verify: send WARDLookup with NO pushed proof material, so the device
     * computes the target entry_key itself, emits WARDProofRequest, and returns the
     * verdict. `buildAck` answers that request reactively from the host's stored
     * blobs (scoped to this call, like perform/displayAddress). This lets a
     * non-membership verdict for an absent address be device-proven — the host
     * never needs the target entry_key.
     */
    async lookupPull(
        params: Messages.WARDLookup,
        buildAck: (request: Messages.WARDProofRequest) => Messages.WARDProofAck,
    ): Promise<Messages.WARDLookupAck> {
        this.cmd.setWardProofCallback(request => {
            this.vlog('<- WARDProofRequest', request);

            return buildAck(request);
        });
        try {
            this.vlog('-> WARDLookup (pull)');
            const { message } = await this.cmd.typedCall('WARDLookup', 'WARDLookupAck', params);
            this.vlog('<- WARDLookupAck', message);

            return message;
        } finally {
            this.cmd.setWardProofCallback(undefined);
        }
    }

    /**
     * Guard: the device's own SLIP21-derived ward_id proves which seed+passphrase
     * was unlocked. It must match the requested wardId (the provider scope key and
     * what the WM signature binds to). Shared by the sync and commit echo checks.
     */
    static assertWardId(deviceWardId: string | undefined, requestedWardId: string, ctx: string) {
        if (deviceWardId === undefined) {
            throw ERRORS.TypedError('Runtime', `${ctx}: device did not return a ward_id`);
        }
        if (deviceWardId !== requestedWardId) {
            throw ERRORS.TypedError(
                'Runtime',
                `${ctx}: device ward_id (${deviceWardId}) does not match requested wardId (${requestedWardId})`,
            );
        }
    }
}
