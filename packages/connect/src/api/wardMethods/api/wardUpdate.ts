/* eslint-disable no-console -- verbose WARD dbchange diagnostics */
import type { MethodPermission } from '@trezor/connect-common';
import { WardUpdateSchema } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';
import { blobRows, commitLocal, loadHead, offlineRoot, prepareChange } from '@trezor/ward';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import * as settingsStore from '../../../data/settingsStore';
import { buildAckByKey } from '../proofAck';
import { WardCommitConflictError, getWardManagerService } from '../wardManagerService';
import { WardSession } from '../wardSession';

export default class WardUpdate extends AbstractMethod<'wardUpdate', WardUpdateSchema> {
    constructor(message: MethodMessage<'wardUpdate'>) {
        const { payload } = message;
        Assert(WardUpdateSchema, payload);

        const params = {
            appId: payload.appId,
            address: payload.address,
            networkSymbol: payload.networkSymbol,
            metadata: payload.metadata,
            wardId: payload.wardId,
        };

        super(message, params);
        // No `device` supplied means offline mode: persist locally and recompute the root
        // without a device round-trip. Auto-selecting a connected device is not supported —
        // callers that want the device must name it explicitly.
        this.useDevice = payload.device !== undefined;
        this.useDeviceState = false;
        this.useEmptyPassphrase = true;
    }

    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    get confirmation() {
        return {
            view: 'device-management' as const,
            label: 'Update the auth-label entry for this address on the device?',
        };
    }

    get info() {
        return 'Update WARD address entry';
    }

    async run() {
        const provider = settingsStore.get('wardDataProvider');
        if (!provider) {
            throw ERRORS.TypedError(
                'Runtime',
                'wardUpdate requires wardDataProvider to be set via TrezorConnect.init()',
            );
        }
        const wardManager = getWardManagerService();
        const { appId, address, networkSymbol, metadata, wardId } = this.params;
        const vlog = (...m: unknown[]) => console.log('[wardUpdate]', ...m);

        // --- Application flow: resolve DB state + prepare the requested change. ---
        const { rows, tree } = await loadHead(provider, wardId);
        vlog('head', { rows: rows.length, tree: tree?.root ? tree.counter : 'empty' });
        // Inconsistent host state: a stored root but no rows means every proof we build
        // will be empty (INSERTs will look like INIT and the device will reject them with
        // "Tree is not empty"). Surface it loudly rather than failing cryptically device-side.
        if (tree?.root && rows.length === 0) {
            console.warn(
                `[wardUpdate] INCONSISTENT host state for wardId=${wardId}: tree_state root present ` +
                    `(counter ${tree.counter}) but 0 address rows — proofs will be empty. ` +
                    'The provider likely failed to persist entries (see localCacheError on prior writes).',
            );
        }
        const oldEntry = await provider.lookup(wardId, appId, address, networkSymbol);
        const change = prepareChange(
            rows,
            appId,
            oldEntry,
            address,
            networkSymbol,
            metadata,
            tree?.counter ?? 0,
        );
        vlog('ENTER', {
            wardId,
            appId,
            address,
            networkSymbol,
            op: change.op,
            mode: this.useDevice ? 'device' : 'offline',
        });

        if (!this.useDevice) {
            await provider.upsert(wardId, appId, address, networkSymbol, change.newEntry);
            const root = offlineRoot(await provider.getAllEntries(wardId));
            await provider.setTreeState(wardId, { root, counter: change.newEntry.counter });

            return { counter: change.newEntry.counter, root };
        }

        // --- WARD flow: authenticated round via the device transport seam. ---
        const session = new WardSession(this.getDevice().getCommands(), vlog);

        // Sync + adopt: bootstrap the device to the host's current tree state.
        const sync = await session.sync();
        WardSession.assertWardId(sync.wardId, wardId, 'wardUpdate');
        // TODO(handoff, gap 2): the WM signs the host-supplied (counter, mac) here.
        // A hardened WM must sign its OWN stored head — see gaps.md #2 and
        // wardManagerService.signAttestation.
        const attestation = await wardManager.signAttestation({
            wardId,
            nonce: sync.nonce,
            counter: tree?.counter ?? 0,
            mac: tree?.mac,
        });
        // TODO(handoff, gap 3): validate (WM_HEAD, DB_HEAD) consistency host-side
        // before adopt, instead of relying on firmware to reject late at reconcile.
        await session.adopt(
            { counter: tree?.counter ?? 0, mac: tree?.mac, wmSignature: attestation },
            tree?.root,
        );

        // Queue → perform → confirm. The device is the counter authority. It pulls the
        // pre-state proof BY the opaque entry_key it computed; we answer reactively from
        // the host's stored leaf blobs (we hold no keys and can't compute entry_key).
        const preBlobs = blobRows(rows);
        const { pendingId } = await session.queue(appId, address, change.newValueHex);
        const candidate = await session.perform(
            req => buildAckByKey(preBlobs, req.entry_key),
            pendingId,
        );
        WardSession.assertWardId(candidate.wardId, wardId, 'wardUpdate');

        let finalSig: string;
        try {
            finalSig = await wardManager.signCandidate({
                wardId,
                counter: candidate.counter,
                mac: candidate.mac,
            });
        } catch (err) {
            if (err instanceof WardCommitConflictError) {
                // Another client advanced the WM head first: our candidate (counter_T) is
                // stale and can never be confirmed. Discard it so the device queue isn't
                // left stuck on a dead candidate, and surface a structured conflict so the
                // caller can re-sync and retry.
                // TODO(handoff): auto resync + re-perform + retry (flow.md 409->resync path).
                vlog('WM commit conflict; discarding stale candidate', { wmCounter: err.counter });
                try {
                    await session.discardPending(pendingId);
                } catch (discardErr) {
                    vlog('discardPending after conflict failed (best-effort)', discardErr);
                }

                return { counter: err.counter, root: '', conflict: true };
            }
            throw err;
        }
        const installed = await session.confirm({
            counter: candidate.counter,
            mac: candidate.mac,
            wmSignature: finalSig,
            pendingId,
        });

        // The device already installed this update; a persistence failure only means the
        // local cache is stale, not that the operation failed. Surface it as
        // `localCacheError` so callers still get the device-confirmed counter/root.
        let localCacheError: string | undefined;
        try {
            await commitLocal(provider, wardId, appId, address, networkSymbol, metadata, {
                counter: installed.counter,
                root: installed.root,
                rootMac: installed.rootMac,
                // Persist the device's encrypted leaf blob so future proofs (and roots)
                // are served by entry_key. Present for insert/update (non-empty ct).
                ...(candidate.entryKey !== undefined &&
                    candidate.ct !== undefined &&
                    candidate.ct !== '' && {
                        blob: {
                            entryKey: candidate.entryKey,
                            entryType: candidate.entryType ?? 'address',
                            nonce: candidate.nonce ?? '',
                            tag: candidate.tag ?? '',
                            ct: candidate.ct,
                        },
                    }),
            });
        } catch (err) {
            localCacheError = err instanceof Error ? err.message : String(err);
            // Loud, not a debug line: a swallowed persist failure here leaves the host DB
            // missing this entry while its tree_state advances — the next write then builds
            // an empty/incorrect proof and the device rejects it. Make it impossible to miss.
            console.error(
                `[wardUpdate] LOCAL CACHE PERSIST FAILED (device already committed counter ` +
                    `${installed.counter}) for wardId=${wardId} appId=${appId} address=${address}: ` +
                    `${localCacheError}. Host DB is now out of sync with the device — resync required.`,
            );
        }

        // §7 lineage: record the authenticated transition (prev→target root at this
        // counter + the leaf blob it wrote) so a fresh/partial host can hydrate + VERIFY
        // the MPT by backward-walk instead of trusting a flat rebuild (see @trezor/ward
        // `hydrate`). All values are already in hand — no extra device round. Best-effort
        // like commitLocal: a failure only degrades future hydration, not this write.
        if (provider.appendTransition !== undefined && installed.root !== undefined) {
            try {
                await provider.appendTransition(wardId, {
                    counter: installed.counter,
                    prevRoot: tree?.root ?? '',
                    targetRoot: installed.root,
                    ...(installed.rootMac !== undefined && { targetRootMac: installed.rootMac }),
                    // A single-leaf commit is a batch of one (batch-native transition).
                    leaves: [
                        {
                            entryKey: candidate.entryKey ?? '',
                            entryType: candidate.entryType ?? 'address',
                            nonce: candidate.nonce ?? '',
                            tag: candidate.tag ?? '',
                            ct: candidate.ct ?? '',
                        },
                    ],
                });
            } catch (err) {
                console.error(
                    `[wardUpdate] appendTransition FAILED (device committed counter ` +
                        `${installed.counter}) for wardId=${wardId}: ` +
                        `${err instanceof Error ? err.message : String(err)}. ` +
                        'Lineage log is incomplete — hydration will reject until resynced.',
                );
            }
        }

        return {
            counter: installed.counter,
            root: installed.root ?? '',
            ...(localCacheError !== undefined && { localCacheError }),
        };
    }
}
