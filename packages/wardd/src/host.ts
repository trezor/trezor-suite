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
    type BlobRow,
    EMPTY_PART,
    type RelayCacheResult,
    type RelayCacheValidation,
    type RelayDevice,
    RelayFailure,
    type RelayListResult,
    type RelayLookupResult,
    type RelayMessage,
    type RelaySyncResult,
    type RelayUpdateResult,
    type RelayValidateResult,
    type TreeState,
    type WardLabel,
    type WardProvider,
    type WardTransition,
    prepareChange,
    traceLineage,
} from '@trezor/ward';

import type { Log } from './logging';
import { forwardingDelay } from './pacing';
import { buildNodeAck, buildProofAck, readLeafContent, readLeafIdentity } from './proofs';
import { rebuildTrie } from './reconstruction';
import { recoverWard } from './recovery';
import { type SignedTransition, normalizeRoot } from './transition';
import { type WmClient, WmConflict, WmUnavailable } from './wm';

export type { Log } from './logging';

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
    delays?: boolean;
    /**
     * Answer a label pull's `freshness_nonce` with the WM's current-head attestation, so the
     * device can tell whether its root is still current. Optional and OFF by default: it costs
     * one WM request per label display. Without it the device shows the label as before.
     */
    labelFreshness?: boolean;
};

export class WardHost {
    private wardId?: string;
    private syncedHead?: TreeState;
    private deviceHead?: TreeState;
    private syncedHistory?: SignedTransition[];
    private headNonce?: string;
    /** The leaves rebuilt for one synced head, reused by the many pulls of one listing walk. */
    private listingRows?: { key: string; rows: BlobRow[] };

    constructor(private readonly deps: WardHostDeps) {}

    /** Send one message and require the answer `expect`; a device `Failure` ends the conversation. */
    private async ask(device: RelayDevice, request: RelayMessage, expect: string): Promise<Body> {
        this.deps.log('->', request.name);
        await forwardingDelay(this.deps.log, `wardd -> HWI ${request.name}`, this.deps.delays);
        const reply = await device(request);
        this.deps.log('<-', reply.name);
        await forwardingDelay(this.deps.log, `HWI ${reply.name} -> wardd`, this.deps.delays);
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
        this.deviceHead = { counter: ack.counter, root: ack.root ?? '' };

        const attestation = await this.deps.wm.current(wardId, ack.nonce);
        this.headNonce = attestation.headNonce;
        const tree: TreeState = {
            counter: attestation.counter,
            root: attestation.root,
            ...(attestation.mac && { mac: attestation.mac }),
        };
        const { counter } = tree;
        const { signature } = attestation;
        this.syncedHistory = await this.deps.wm.history(wardId);
        await rebuildTrie(this.deps.storage, wardId, tree, this.deps.log, this.syncedHistory);
        this.syncedHead = { ...tree };
        await this.ask(
            device,
            {
                name: 'WARDIngestAttestation',
                message: {
                    counter,
                    ...(tree?.mac ? { mac: tree.mac } : {}),
                    wm_signature: signature,
                    timestamp: attestation.timestamp,
                    head_nonce: attestation.headNonce,
                },
            },
            'WARDIngestAttestationAck',
        );
        // EMPTY TREE: the firmware reads an absent mac as "attested empty tree" and then requires
        // the root to be absent too. The host's empty root is '', which is NOT absent on the wire
        // (an empty bytes field arrives as b""), so '' is omitted with the mac.
        const deviceCounter = ack.counter;
        if (!Number.isInteger(deviceCounter) || ack.root_known !== true)
            throw new RelayFailure('device_failure', 'device has no durable trusted root');
        if (deviceCounter > counter)
            throw new RelayFailure(
                'bad_request',
                'wm_behind: device anchor exceeds the authoritative head',
            );
        let request: RelayMessage;
        let response: string;
        if (deviceCounter < counter) {
            if (!this.deps.storage.getTransitions)
                throw new RelayFailure('no_store', 'authenticated history is required');
            const records = this.syncedHistory;
            const history = records.some(record => record.kind === 'revert')
                ? records.toReversed().map(record => ({
                      counter: record.counter,
                      targetRoot: record.root,
                      prevRoot: record.fromRoot,
                      authCommit: record.authCommit,
                  }))
                : traceLineage(await this.deps.storage.getTransitions(wardId), tree.root, counter);
            const authoritative = new Map(records.map(record => [record.counter, record]));
            const links = history
                .toReversed()
                .filter(link => link.counter > deviceCounter)
                .map(link => {
                    const accepted = authoritative.get(link.counter);
                    if (
                        accepted?.root !== link.targetRoot ||
                        accepted.fromRoot !== link.prevRoot ||
                        accepted.authCommit !== link.authCommit
                    )
                        throw new RelayFailure(
                            'bad_request',
                            'replica history differs from authoritative history',
                        );

                    return {
                        from_counter: link.counter - 1,
                        ...(link.prevRoot && { from_root: link.prevRoot }),
                        to_counter: link.counter,
                        ...(link.targetRoot && { to_root: link.targetRoot }),
                        auth_commit: link.authCommit,
                    };
                });
            request = { name: 'WARDVerifyChain', message: { links } };
            response = 'WARDVerifyChainAck';
        } else {
            request = { name: 'WARDReconcile', message: tree.root ? { root: tree.root } : {} };
            response = 'WARDReconcileAck';
        }
        const reconciled = await this.ask(device, request, response);
        await this.deps.storage.setTreeState(wardId, tree);

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
        str(params, 'networkSymbol');
        const { wardId } = await this.sync(device, params);

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
        if (typeof ack.membership !== 'boolean')
            throw new RelayFailure('device_failure', 'device omitted the membership verdict');
        const isMember = ack.membership;

        return {
            wardId,
            valid,
            isMember,
            counter: ack.counter ?? 0,
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
        let offline = false;
        try {
            await this.sync(device, params);
        } catch (error) {
            if (!(error instanceof WmUnavailable)) throw error;
            offline = true;
        }
        const wardId = this.requireWardId();

        const tree = this.syncedHead;
        if (removing && !offline) {
            const verdict = await this.lookup(device, params);
            if (!verdict.valid)
                throw new RelayFailure('device_failure', 'cannot delete without a valid proof');
            if (!verdict.isMember)
                return { wardId, counter: verdict.counter, root: this.syncedHead?.root ?? '' };
        }
        const change = prepareChange(null, networkSymbol, metadata, tree?.counter ?? 0, removing);
        const valueHex = params.valueHex ?? change.newValueHex;
        if (
            typeof valueHex !== 'string' ||
            valueHex.length % 2 !== 0 ||
            !/^[0-9a-f]*$/i.test(valueHex)
        )
            throw new RelayFailure('bad_request', 'valueHex must contain whole hexadecimal bytes');

        const queued = await this.ask(
            device,
            {
                name: 'WARDQueueUpdate',
                message: {
                    address: utf8Hex(address),
                    new_value: valueHex,
                    delete: removing,
                    app_id: appId,
                },
            },
            'WARDQueueUpdateAck',
        );
        const pendingId: number = queued.pending_id;
        if (offline) {
            this.deps.log('queue.offline', { pendingId });

            return {
                wardId,
                counter: this.deviceHead?.counter ?? 0,
                root: this.deviceHead?.root ?? '',
                queued: true,
                pendingId,
            };
        }

        return this.publishPending(device, wardId, pendingId);
    }

    private async publishPending(
        device: RelayDevice,
        wardId: string,
        pendingId: number,
    ): Promise<RelayUpdateResult> {
        const { storage, wm, log } = this.deps;
        const candidate = await this.ask(
            device,
            {
                name: 'WARDPerformBatch',
                message: { pending_ids: [pendingId] },
            },
            'WARDPerformBatchAck',
        );
        if (candidate.ward_id !== undefined && candidate.ward_id !== wardId) {
            throw new RelayFailure(
                'ward_id_mismatch',
                `WARDPerformUpdateAck ward_id (${candidate.ward_id}) is not the synced ${wardId}`,
            );
        }

        if (!storage.appendTransition || !storage.getTransitions)
            throw new RelayFailure(
                'no_store',
                'durable transition storage is required before publication',
            );
        if (!Array.isArray(candidate.leaves) || candidate.leaves.length !== 1)
            throw new RelayFailure('device_failure', 'expected one device-produced leaf');
        const output = candidate.leaves[0];
        const identity = readLeafIdentity(output.identity);
        const content = readLeafContent(output.content);
        const leaf = {
            entryKey: output.entry_key,
            keyType: identity.keyType,
            identity: identity.part ?? EMPTY_PART,
            content: content ?? EMPTY_PART,
        };
        const transition: WardTransition = {
            kind: 'commit',
            headNonce: this.headNonce,
            counter: candidate.counter,
            prevRoot: normalizeRoot(candidate.from_root),
            targetRoot: normalizeRoot(candidate.new_root),
            targetRootMac: candidate.mac,
            leaves: [leaf],
            authCommit: candidate.auth_commit,
            headMac: candidate.head_mac,
            sigCommit: candidate.sig_commit,
        };
        const publication: SignedTransition = {
            wardId,
            fromCounter: candidate.counter - 1,
            fromRoot: transition.prevRoot,
            counter: candidate.counter,
            root: transition.targetRoot,
            mac: candidate.mac,
            authCommit: candidate.auth_commit,
            signature: candidate.sig_commit,
            kind: 'commit',
            headNonce: this.headNonce!,
        };
        const previewHistory = [...(this.syncedHistory ?? []), publication];
        // Persist the complete candidate before WM advancement; rejected candidates are dead branches.
        await storage.appendTransition(wardId, transition);
        await rebuildTrie(
            storage,
            wardId,
            {
                counter: transition.counter,
                root: transition.targetRoot,
                mac: transition.targetRootMac,
            },
            log,
            previewHistory,
        );
        let finalSig: string;
        try {
            finalSig = await wm.commit(publication);
        } catch (err) {
            if (err instanceof WmUnavailable) {
                return {
                    wardId,
                    counter: this.deviceHead?.counter ?? 0,
                    root: this.deviceHead?.root ?? '',
                    queued: true,
                    pendingId,
                };
            }
            if (!(err instanceof WmConflict)) throw err;
            this.deps.log('queue.conflict', { pendingId });

            return {
                wardId,
                counter: err.counter,
                root: '',
                conflict: true,
                queued: true,
                pendingId,
            };
        }
        const installed = await this.ask(
            device,
            {
                name: 'WARDConfirmBatchByWM',
                message: { counter: candidate.counter, mac: candidate.mac, wm_signature: finalSig },
            },
            'WARDConfirmBatchByWMAck',
        );
        this.syncedHistory = previewHistory;
        this.syncedHead = {
            counter: installed.counter,
            root: installed.new_root ?? '',
            mac: installed.root_mac,
        };

        let localCacheError: string | undefined;
        try {
            await storage.setTreeState(wardId, this.syncedHead);
        } catch (err) {
            localCacheError = err instanceof Error ? err.message : String(err);
            log(
                `STORE FAILED after the device committed counter ${installed.counter} for ` +
                    `${localCacheError}. Resync required.`,
            );
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
        const tree = this.syncedHead ?? (await this.deps.storage.getTreeState(wardId));
        const rows = await rebuildTrie(
            this.deps.storage,
            wardId,
            tree,
            this.deps.log,
            this.syncedHistory,
        );
        const present = rows.some(r => r.entryKeyHex === entryKey);
        this.deps.log(
            `PROOF build entry_key=${entryKey} present=${present} entries=${rows.length}` +
                ` counter=${tree?.counter ?? 0} root=${tree?.root || 'EMPTY'}`,
        );

        const ack: Body = buildProofAck(rows, entryKey);
        const attestation = await this.freshness(wardId, request.freshness_nonce);
        if (attestation) ack.attestation = attestation;
        this.logProof(ack, entryKey, present);
        this.deps.log(
            'proof.outgoing',
            JSON.stringify({
                name: 'WARDProofAck',
                request: { entry_key: entryKey },
                message: ack,
            }),
        );

        return ack;
    }

    /**
     * The WM's current-head attestation over the device's `freshness_nonce`, or undefined when
     * freshness is off, the device sent no nonce, or the WM cannot be reached -- a label is never
     * blocked on it. The device verifies it; nothing here is trusted or installed.
     */
    private async freshness(wardId: string, nonce: unknown): Promise<Body | undefined> {
        if (!this.deps.labelFreshness || typeof nonce !== 'string' || nonce === '')
            return undefined;
        try {
            const head = await this.deps.wm.current(wardId, nonce);

            return {
                counter: head.counter,
                ...(head.mac ? { mac: head.mac } : {}),
                wm_signature: head.signature,
                timestamp: head.timestamp,
                head_nonce: head.headNonce,
            };
        } catch (error) {
            this.deps.log(`FRESHNESS unavailable: ${(error as Error).message}`);

            return undefined;
        }
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

    /**
     * The listing round: sync, then WARDListEntries. The device walks its trusted root and pulls
     * every node (WARDNodeRequest, answered through `answerNodeRequest`), showing each matching
     * entry on its own screen. Only the counts come back; wardd never sees the plaintext.
     */
    async listEntries(device: RelayDevice, params: Body): Promise<RelayListResult> {
        const { wardId } = await this.sync(device, params);
        const filter = (key: string, type: 'string' | 'number') => {
            const v = params[key];
            if (v === undefined) return undefined;
            if (typeof v !== type)
                throw new RelayFailure('bad_request', `${key} must be a ${type}`);

            return v;
        };
        const ack = await this.ask(
            device,
            {
                name: 'WARDListEntries',
                message: {
                    app_id: filter('appId', 'string'),
                    key_type: filter('keyType', 'string'),
                    device_id: filter('deviceId', 'number'),
                },
            },
            'WARDListEntriesAck',
        );

        return {
            wardId,
            shown: ack.shown,
            entries: ack.entries,
            counter: ack.counter,
            complete: ack.complete === true,
        };
    }

    /**
     * The offline-cache round: sync, then WARDCacheEntry. The device pulls the proof for the entry
     * (answered by `answerProofRequest`), verifies it against the head just synced, and stores
     * the entry in its app's offline store. wardd learns only whether a record was replaced.
     */
    async cacheEntry(device: RelayDevice, params: Body): Promise<RelayCacheResult> {
        const entryKey = str(params, 'entryKey').toLowerCase();
        if (!/^[0-9a-f]{64}$/.test(entryKey))
            throw new RelayFailure('bad_request', 'entryKey must be 32 bytes of hex');
        const { wardId } = await this.sync(device, params);
        const ack = await this.ask(
            device,
            {
                name: 'WARDCacheEntry',
                message: { entry_key: entryKey, sticky: params.sticky === true },
            },
            'WARDCacheEntryAck',
        );

        return { wardId, replaced: ack.replaced === true, counter: ack.counter };
    }

    /** Back up the device's cached entries: blobs sealed to the wallet, opaque to wardd. */
    async exportCache(device: RelayDevice): Promise<Body> {
        const ack = await this.ask(
            device,
            { name: 'WARDCacheExport', message: {} },
            'WARDCacheExportAck',
        );

        return { entries: ack.entries ?? [] };
    }

    /**
     * Load a backup into the device's cache. wardd syncs first: the device checks every entry
     * against its root with a proof it pulls (answered by `answerProofRequest`), storing only
     * what WARD still holds; it refuses blobs another wallet sealed.
     */
    async importCache(device: RelayDevice, params: Body): Promise<Body> {
        const { entries } = params;
        if (
            !Array.isArray(entries) ||
            !entries.every(e => typeof e === 'string' && /^([0-9a-f]{2})+$/i.test(e))
        )
            throw new RelayFailure('bad_request', 'entries must be a list of hex blobs');
        await this.sync(device, params);
        const ack = await this.ask(
            device,
            { name: 'WARDCacheImport', message: { entries } },
            'WARDCacheImportAck',
        );

        return { imported: ack.imported, skipped: ack.skipped };
    }

    /**
     * Check the device's cached entries against the head just synced: the device pulls one proof
     * per entry (answered by `answerProofRequest`) and keeps, updates or removes each on verified
     * proofs only. Entries WARD proves absent are removed, sticky ones too.
     */
    private async checkCache(device: RelayDevice): Promise<RelayCacheValidation> {
        const ack = await this.ask(
            device,
            { name: 'WARDValidateCache', message: {} },
            'WARDValidateCacheAck',
        );

        return {
            checked: ack.checked,
            unchanged: ack.unchanged,
            updated: ack.updated,
            removed: ack.removed,
        };
    }

    /** The conversation: sync, then validate the device's offline cache against the new head. */
    async validateCache(device: RelayDevice, params: Body): Promise<RelayValidateResult> {
        const synced = await this.sync(device, params);

        return { ...synced, cache: await this.checkCache(device) };
    }

    /**
     * The `sync` method: adopt the WM head, then validate the offline cache automatically. A
     * firmware without the offline store, or one older than WARDValidateCache ("Unexpected
     * message"), refuses the validation; that is not a sync failure. Any other refusal -- a proof
     * the device rejected -- is.
     */
    async syncAndValidate(
        device: RelayDevice,
        params: Body,
    ): Promise<
        RelaySyncResult & { cache?: RelayCacheValidation; queued?: boolean; conflict?: boolean }
    > {
        if (params.recover === true) {
            await recoverWard({
                ...this.deps,
                params,
                ask: (request, expect) => this.ask(device, request, expect),
            });
        }
        let synced = await this.sync(device, params);
        const pending = await this.ask(
            device,
            { name: 'WARDListPendingEdits', message: {} },
            'WARDListPendingEditsAck',
        );
        for (const pendingId of pending.pending_ids ?? []) {
            const published = await this.publishPending(device, synced.wardId, pendingId);
            if (published.queued) return { ...synced, queued: true, conflict: published.conflict };
            synced = await this.sync(device, params);
        }
        try {
            return { ...synced, cache: await this.checkCache(device) };
        } catch (error) {
            if (
                error instanceof RelayFailure &&
                /no offline store|unexpected message/i.test(error.message)
            )
                return synced;
            throw error;
        }
    }

    /** Answer one listing pull (WARDNodeRequest body) from the wallet this endpoint last synced. */
    async answerNodeRequest(params: Body): Promise<Body> {
        const wardId = this.requireWardId();
        const request = params.request ?? {};
        if (typeof request.node_hash !== 'string' || !/^[0-9a-f]{64}$/i.test(request.node_hash)) {
            throw new RelayFailure('bad_request', 'request.node_hash must be 32 bytes of hex');
        }
        const tree = this.syncedHead ?? (await this.deps.storage.getTreeState(wardId));
        const key = `${wardId}:${tree?.counter ?? 0}:${tree?.root ?? ''}`;
        // rebuildTrie replays from genesis and checks the result against this exact head, so the
        // rows for one (counter, root) never change: rebuild once per walk, not once per pull.
        if (this.listingRows?.key !== key) {
            const rows = await rebuildTrie(
                this.deps.storage,
                wardId,
                tree,
                this.deps.log,
                this.syncedHistory,
            );
            this.listingRows = { key, rows };
        }
        const ack = buildNodeAck(this.listingRows.rows, request.node_hash.toLowerCase());
        this.deps.log(
            `NODES served node_hash=${request.node_hash} count=${ack.nodes.length}` +
                ` entries=${this.listingRows.rows.length}`,
        );

        return ack;
    }

    async status(): Promise<RelaySyncResult> {
        const wardId = this.requireWardId();
        const tree = await this.deps.storage.getTreeState(wardId);

        return { wardId, counter: tree?.counter ?? 0, root: tree?.root ?? '' };
    }
}
