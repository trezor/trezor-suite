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
    walletId?: string;
    wardId?: string;
};

/** Installed authenticated state after adopt / confirm (WARDReconcile / WARDConfirmedByWMAck). */
export type WardInstalled = {
    counter: number;
    root?: string;
    walletId?: string;
    rootMac?: string;
};

/** The authorized candidate returned by perform (WARDPerformUpdateAck). */
export type WardCandidate = {
    counter: number;
    root?: string;
    mac?: string;
    walletId?: string;
    wardId?: string;
};

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
            walletId: message.wallet_id,
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
            ...(head.mac !== undefined && { mac: head.mac }),
            wm_signature: head.wmSignature,
        });

        this.vlog('-> WARDReconcile');
        const { message } = await this.cmd.typedCall('WARDReconcile', 'WARDReconcileAck', {
            ...(dbRoot !== undefined && { root: dbRoot }),
        });
        this.vlog('<- WARDReconcileAck', message);

        return {
            counter: message.counter,
            root: message.new_root,
            walletId: message.wallet_id,
            rootMac: message.root_mac,
        };
    }

    /** Queue an edit INTENT (pull model): no proof, no counter. Returns the pending_id. */
    async queue(
        address: string,
        newValueHex: string,
    ): Promise<{ pendingId?: number; walletId?: string }> {
        this.vlog('-> WARDQueueUpdate');
        const { message } = await this.cmd.typedCall('WARDQueueUpdate', 'WARDQueueUpdateAck', {
            address: utf8Hex(address),
            new_value: newValueHex,
        });
        this.vlog('<- WARDQueueUpdateAck', message);

        return { pendingId: message.pending_id, walletId: message.wallet_id };
    }

    /**
     * Authorize a queued intent. The device DERIVES counter_T and PULLS the proof
     * on demand — answered by `proofAck` via the WARDProofRequest callback, which is
     * scoped to this call (set before, cleared in finally).
     */
    async perform(proofAck: Messages.WARDProofAck, pendingId?: number): Promise<WardCandidate> {
        this.cmd.setWardProofCallback(request => {
            this.vlog('<- WARDProofRequest', request);

            return proofAck;
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
                root: message.new_root,
                mac: message.mac,
                walletId: message.wallet_id,
                wardId: message.ward_id,
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
            ...(args.mac !== undefined && { mac: args.mac }),
            wm_signature: args.wmSignature,
            ...(args.pendingId !== undefined && { pending_id: args.pendingId }),
        });
        this.vlog('<- WARDConfirmedByWMAck', message);

        return {
            counter: message.counter,
            root: message.new_root,
            walletId: message.wallet_id,
            rootMac: message.root_mac,
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
        proofAck: Messages.WARDProofAck,
    ): Promise<void> {
        this.cmd.setWardProofCallback(request => {
            this.vlog('<- WARDProofRequest', request);

            return proofAck;
        });
        try {
            this.vlog('-> DisplayAddress');
            await this.cmd.typedCall('DisplayAddress', 'Success', params);
            this.vlog('<- Success');
        } finally {
            this.cmd.setWardProofCallback(undefined);
        }
    }

    /** Verify a membership / non-membership proof against the device's authenticated root. */
    async lookup(params: Messages.WARDLookup): Promise<Messages.WARDLookupAck> {
        this.vlog('-> WARDLookup');
        const { message } = await this.cmd.typedCall('WARDLookup', 'WARDLookupAck', params);
        this.vlog('<- WARDLookupAck', message);

        return message;
    }

    /** Report the device's queued pending-edit addresses (and echoed identities). */
    async listPending(): Promise<{
        addresses: string[];
        pendingIds: number[];
        walletId?: string;
        wardId?: string;
    }> {
        this.vlog('-> WARDListPendingEdits');
        const { message } = await this.cmd.typedCall(
            'WARDListPendingEdits',
            'WARDListPendingEditsAck',
            {},
        );
        this.vlog('<- WARDListPendingEditsAck', message);

        return {
            addresses: message.addresses ?? [],
            pendingIds: message.pending_ids ?? [],
            walletId: message.wallet_id,
            wardId: message.ward_id,
        };
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
