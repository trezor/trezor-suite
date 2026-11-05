/**
 * The WARD flows, for ONE relay endpoint (one host-library connection). Moved here from Connect's
 * `wardInit` / `wardVerify` / `wardUpdate` / `WardSession`: Connect and HWI now only relay.
 *
 * Every flow is a CONVERSATION: wardd decides which message goes to the device next and the host
 * library sends it on its session (`RelayDevice`). The device's mid-call WARDProofRequest never
 * reaches a flow -- the host library answers it through `answerProofRequest`, which serves the wallet this
 * endpoint last synced.
 *
 * The endpoint's only state is that wallet (`wardId`); the data lives in the `WardProvider`.
 */
import { bytesToHex } from '@noble/hashes/utils.js';

import {
    EMPTY_PART,
    type RelayDevice,
    RelayFailure,
    type RelayLookupResult,
    type RelayMessage,
    type RelaySyncResult,
    type RelayUpdateResult,
    type WardLabel,
    type WardProvider,
    blobRows,
    commitLocal,
    loadHead,
    prepareChange,
} from '@trezor/ward';

import { buildProofAck, readLeafContent, readLeafIdentity } from './proofs';
import { type WmClient, WmConflict } from './wm';

export type Log = (...m: unknown[]) => void;

type Body = Record<string, any>;

const utf8Hex = (s: string) => bytesToHex(new TextEncoder().encode(s));

const str = (params: Body, key: string): string => {
    const v = params[key];
    if (typeof v !== 'string' || v === '')
        throw new RelayFailure('bad_request', `${key} is required`);

    return v;
};

/** What a flow needs from the outside: storage and the WM. */
export type WardHostDeps = {
    storage: WardProvider;
    wm: WmClient;
    log: Log;
};

export class WardHost {
    private wardId?: string;

    constructor(private readonly deps: WardHostDeps) {}

    /** Send one message and require the answer `expect`; a device `Failure` ends the conversation. */
    private async ask(device: RelayDevice, request: RelayMessage, expect: string): Promise<Body> {
        this.deps.log('->', request.name);
        const reply = await device(request);
        this.deps.log('<-', reply.name);
        if (reply.name === 'Failure') {
            throw new RelayFailure(
                'device_failure',
                `${request.name}: ${String(reply.message.message ?? reply.message.code ?? 'Failure')}`,
            );
        }
        if (reply.name !== expect) {
            throw new RelayFailure(
                'device_failure',
                `${request.name}: expected ${expect}, the device answered ${reply.name}`,
            );
        }

        return reply.message;
    }

    private requireWardId(): string {
        if (!this.wardId) throw new RelayFailure('no_store', 'sync first');

        return this.wardId;
    }

    /**
     * The sync round: WARDSync (the device mints a nonce and reports its ward_id), the WM signs the
     * freshness attestation over the head wardd stores, then WARDIngestAttestation + WARDReconcile
     * install it on the device. Every other flow starts with it, since a device session holds no
     * authenticated root until a sync installs one.
     */
    async sync(device: RelayDevice, params: Body = {}): Promise<RelaySyncResult> {
        const ack = await this.ask(device, { name: 'WARDSync', message: {} }, 'WARDSyncAck');
        const wardId = ack.ward_id;
        if (typeof wardId !== 'string' || wardId === '') {
            throw new RelayFailure('device_failure', 'WARDSyncAck carries no ward_id');
        }
        // The device's own ward_id proves which seed + passphrase is unlocked. A caller that names
        // one must get that wallet, never the device's other one.
        if (params.wardId !== undefined && params.wardId !== wardId) {
            throw new RelayFailure(
                'ward_id_mismatch',
                `the device's ward_id (${wardId}) is not the requested ${String(params.wardId)}`,
            );
        }
        this.wardId = wardId;

        const tree = await this.deps.storage.getTreeState(wardId);
        const counter = tree?.counter ?? 0;
        const signature = await this.deps.wm.attest({
            wardId,
            nonce: ack.nonce,
            counter,
            mac: tree?.mac,
        });
        await this.ask(
            device,
            {
                name: 'WARDIngestAttestation',
                message: {
                    counter,
                    ...(tree?.mac ? { mac: tree.mac } : {}),
                    wm_signature: signature,
                },
            },
            'WARDIngestAttestationAck',
        );
        // EMPTY TREE: the firmware reads an absent mac as "attested empty tree" and then requires
        // the root to be absent too. The host's empty root is '', which is NOT absent on the wire
        // (an empty bytes field arrives as b""), so '' is omitted with the mac.
        const reconciled = await this.ask(
            device,
            { name: 'WARDReconcile', message: tree?.root ? { root: tree.root } : {} },
            'WARDReconcileAck',
        );

        return { wardId, counter: reconciled.counter, root: reconciled.new_root ?? '' };
    }

    /**
     * PULL lookup: WARDLookup with NO pushed proof, so the DEVICE computes the target entry_key and
     * pulls the proof (answered by `answerProofRequest`). Membership and non-membership are both
     * device-proven; the host never needs the entry_key. The stored label is returned only for a
     * membership the device accepted.
     */
    async lookup(device: RelayDevice, params: Body): Promise<RelayLookupResult> {
        const appId = str(params, 'appId');
        const address = str(params, 'address');
        const networkSymbol = str(params, 'networkSymbol');
        const { wardId } = await this.sync(device, params);

        const entry = await this.deps.storage.lookup(wardId, appId, address, networkSymbol);
        const ack = await this.ask(
            device,
            {
                name: 'WARDLookup',
                message: {
                    address: utf8Hex(address),
                    app_id: appId,
                    key_type: 'address',
                    proof: [],
                },
            },
            'WARDLookupAck',
        );
        if (ack.ward_id !== undefined && ack.ward_id !== wardId) {
            throw new RelayFailure(
                'ward_id_mismatch',
                `WARDLookupAck ward_id (${ack.ward_id}) is not the synced ${wardId}`,
            );
        }
        const valid = ack.valid === true;
        const isMember = ack.membership ?? entry !== null;
        // A host that believes the entry exists but whose proof the device rejects is the
        // silent-failure case: make it loud, never mistaken for "no label".
        if (entry !== null && !valid) {
            this.deps.log(
                `MEMBERSHIP PROOF FAILED on device for ${appId}/${address}: the stored state does ` +
                    "not match the device's authenticated root",
            );
        }

        return {
            wardId,
            valid,
            isMember,
            counter: ack.counter ?? 0,
            ...(valid && isMember && entry !== null && { metadata: entry.metadata }),
        };
    }

    /**
     * The write round: sync, then WARDQueueUpdate (the user confirms the intent) -> WARDPerformUpdate
     * (the device derives the counter, pulls the pre-state proof, and returns the leaf it sealed)
     * -> the WM's commit signature -> WARDConfirmedByWM, then store the device's leaf.
     */
    async update(device: RelayDevice, params: Body): Promise<RelayUpdateResult> {
        const appId = str(params, 'appId');
        const address = str(params, 'address');
        const networkSymbol = str(params, 'networkSymbol');
        const removing = params.delete === true;
        const metadata: WardLabel = params.metadata ?? {};
        const { storage, wm, log } = this.deps;
        const { wardId } = await this.sync(device, params);

        const { rows, tree } = await loadHead(storage, wardId);
        if (tree?.root && rows.length === 0) {
            log(
                `INCONSISTENT stored state for ${wardId}: a root at counter ${tree.counter} but no ` +
                    'entries, so every proof will be empty and the device will reject it',
            );
        }
        const oldEntry = await storage.lookup(wardId, appId, address, networkSymbol);
        // The device proves membership of the leaf it removes, so deleting an absent entry
        // cannot produce a valid round.
        if (removing && oldEntry === null) {
            throw new RelayFailure(
                'bad_request',
                `nothing to delete at ${appId}/${address} (${networkSymbol})`,
            );
        }
        const change = prepareChange(
            oldEntry,
            networkSymbol,
            metadata,
            tree?.counter ?? 0,
            removing,
        );

        const queued = await this.ask(
            device,
            {
                name: 'WARDQueueUpdate',
                message: {
                    address: utf8Hex(address),
                    new_value: change.newValueHex,
                    app_id: appId,
                },
            },
            'WARDQueueUpdateAck',
        );
        const pendingId: number | undefined = queued.pending_id;
        const candidate = await this.ask(
            device,
            {
                name: 'WARDPerformUpdate',
                message: { ...(pendingId !== undefined && { pending_id: pendingId }) },
            },
            'WARDPerformUpdateAck',
        );
        if (candidate.ward_id !== undefined && candidate.ward_id !== wardId) {
            throw new RelayFailure(
                'ward_id_mismatch',
                `WARDPerformUpdateAck ward_id (${candidate.ward_id}) is not the synced ${wardId}`,
            );
        }

        let finalSig: string;
        try {
            finalSig = await wm.commit({ wardId, counter: candidate.counter, mac: candidate.mac });
        } catch (err) {
            if (!(err instanceof WmConflict)) throw err;
            // Another writer advanced the WM head first: this candidate can never be confirmed.
            // Discard it so the device's queue is not left stuck on it, and report the conflict
            // so the caller can sync and retry.
            log('WM commit conflict; discarding the stale candidate', { wmCounter: err.counter });
            await device({
                name: 'WARDDiscardPending',
                message: { ...(pendingId !== undefined && { pending_id: pendingId }) },
            }).catch((e: unknown) => log('WARDDiscardPending after the conflict failed', e));

            return { wardId, counter: err.counter, root: '', conflict: true };
        }

        const installed = await this.ask(
            device,
            {
                name: 'WARDConfirmedByWM',
                message: {
                    counter: candidate.counter,
                    ...(candidate.mac && { mac: candidate.mac }),
                    wm_signature: finalSig,
                    ...(pendingId !== undefined && { pending_id: pendingId }),
                },
            },
            'WARDConfirmedByWMAck',
        );

        // The device is the encoder: store the leaf it returned, both parts.
        const identity = readLeafIdentity(candidate.identity);
        const content = readLeafContent(candidate.content);
        const leaf = {
            entryKey: candidate.entry_key ?? '',
            keyType: identity.keyType,
            identity: identity.part ?? EMPTY_PART,
            content: content ?? EMPTY_PART,
        };
        const deleted = content === undefined || content.bodyHex === '';

        // The device already installed the change; a failure to store it only means wardd's copy
        // is stale. Report it as `localCacheError` so the caller still gets the device's counter.
        let localCacheError: string | undefined;
        try {
            await commitLocal(storage, wardId, appId, address, networkSymbol, metadata, {
                counter: installed.counter,
                root: installed.new_root,
                rootMac: installed.root_mac,
                deleted,
                ...(!deleted && candidate.entry_key !== undefined && { blob: leaf }),
            });
        } catch (err) {
            localCacheError = err instanceof Error ? err.message : String(err);
            log(
                `STORE FAILED after the device committed counter ${installed.counter} for ` +
                    `${wardId} ${appId}/${address}: ${localCacheError}. Resync required.`,
            );
        }

        // The lineage record (prev root -> target root at this counter, with the leaf it wrote),
        // so a fresh or partial host can rebuild AND verify the trie (`hydrate`). Recorded even
        // when the tree became empty: hydrate replays that too.
        if (storage.appendTransition !== undefined) {
            try {
                await storage.appendTransition(wardId, {
                    counter: installed.counter,
                    prevRoot: tree?.root ?? '',
                    targetRoot: installed.new_root ?? '',
                    ...(installed.root_mac && { targetRootMac: installed.root_mac }),
                    leaves: [leaf],
                });
            } catch (err) {
                log(`appendTransition FAILED at counter ${installed.counter}`, err);
            }
        }

        return {
            wardId,
            counter: installed.counter,
            root: installed.new_root ?? '',
            ...(localCacheError !== undefined && { localCacheError }),
        };
    }

    /** Answer one device pull (WARDProofRequest body) from the wallet this endpoint last synced. */
    async answerProofRequest(params: Body): Promise<Body> {
        const wardId = this.requireWardId();
        const request = params.request ?? {};
        if (typeof request.entry_key !== 'string') {
            throw new RelayFailure('bad_request', 'request.entry_key is required');
        }
        const entryKey: string = request.entry_key;
        const rows = blobRows(await this.deps.storage.getAllEntries(wardId));
        const present = rows.some(r => r.entryKeyHex === entryKey);
        const tree = await this.deps.storage.getTreeState(wardId);
        this.deps.log(
            `PROOF build entry_key=${entryKey} present=${present} entries=${rows.length}` +
                ` counter=${tree?.counter ?? 0} root=${tree?.root || 'EMPTY'}`,
        );

        const ack = buildProofAck(rows, entryKey);
        this.logProof(ack, entryKey, present);

        return ack;
    }

    /**
     * What a served proof says, element by element: enough to see, when the device refuses one,
     * which branch it disagreed on. Ported from the ward-draft daemon's verbose proof log.
     */
    private logProof(ack: Body, entryKey: string, present: boolean) {
        const proof: string[] = ack.proof ?? [];
        const witness: string | undefined = ack.witness_entry_key;
        let kind = 'empty-tree';
        if (present) kind = 'membership';
        else if (witness) kind = 'non-membership';
        // the path the proof walks: the entry itself, or the witness that sits where it would be
        const pathKey = witness ?? entryKey;
        const bit = (keyHex: string, n: number) =>
            keyHex.length === 64
                ? (parseInt(keyHex.slice((n >> 3) * 2, (n >> 3) * 2 + 2), 16) >> (7 - (n & 7))) & 1
                : '-';
        this.deps.log(
            `PROOF send kind=${kind} elements=${proof.length} bytes=${proof.reduce((n, e) => n + e.length / 2, 0)}` +
                ` witness_entry_key=${witness ?? '-'} witness_commit=${ack.witness_commit ?? '-'}`,
        );
        proof.forEach((element, i) => {
            // element = u16be(split_bit) || sibling(32)
            const splitBit = parseInt(element.slice(0, 4), 16);
            this.deps.log(
                `PROOF   [${i}] split_bit=${splitBit}` +
                    ` path_bit=${bit(pathKey, splitBit)} target_bit=${bit(entryKey, splitBit)}` +
                    ` sibling=${element.slice(4)}`,
            );
        });
    }

    async status(): Promise<RelaySyncResult> {
        const wardId = this.requireWardId();
        const tree = await this.deps.storage.getTreeState(wardId);

        return { wardId, counter: tree?.counter ?? 0, root: tree?.root ?? '' };
    }
}
