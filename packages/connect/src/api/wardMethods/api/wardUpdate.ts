/* eslint-disable no-console -- verbose WARD dbchange diagnostics */
import type { MethodPermission } from '@trezor/connect-common';
import { WardUpdateSchema } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';
import { commitLocal, loadHead, offlineRoot, prepareChange } from '@trezor/ward';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import * as settingsStore from '../../../data/settingsStore';
import { toProofAck } from '../proofAck';
import { getWardManagerService } from '../wardManagerService';
import { WardSession } from '../wardSession';

export default class WardUpdate extends AbstractMethod<'wardUpdate', WardUpdateSchema> {
    constructor(message: MethodMessage<'wardUpdate'>) {
        const { payload } = message;
        Assert(WardUpdateSchema, payload);

        const params = {
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
        const { address, networkSymbol, metadata, wardId } = this.params;
        const vlog = (...m: unknown[]) => console.log('[wardUpdate]', ...m);

        // --- Application flow: resolve DB state + prepare the requested change. ---
        const { rows, tree } = await loadHead(provider, wardId);
        const oldEntry = await provider.lookup(wardId, address, networkSymbol);
        const change = prepareChange(
            rows,
            oldEntry,
            address,
            networkSymbol,
            metadata,
            tree?.counter ?? 0,
        );
        vlog('ENTER', {
            wardId,
            address,
            networkSymbol,
            op: change.op,
            mode: this.useDevice ? 'device' : 'offline',
        });

        if (!this.useDevice) {
            await provider.upsert(wardId, address, networkSymbol, change.newEntry);
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

        // Queue → perform → confirm. The device is the counter authority.
        const { pendingId } = await session.queue(address, change.newValueHex);
        const candidate = await session.perform(toProofAck(change.oldProof), pendingId);
        WardSession.assertWardId(candidate.wardId, wardId, 'wardUpdate');

        const finalSig = await wardManager.signCandidate({
            wardId,
            counter: candidate.counter,
            mac: candidate.mac,
        });
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
            await commitLocal(provider, wardId, address, networkSymbol, metadata, {
                counter: installed.counter,
                root: installed.root,
                rootMac: installed.rootMac,
            });
        } catch (err) {
            localCacheError = err instanceof Error ? err.message : String(err);
            vlog('LOCAL CACHE ERROR (device already committed)', localCacheError);
        }

        return {
            counter: installed.counter,
            root: installed.root ?? '',
            ...(localCacheError !== undefined && { localCacheError }),
        };
    }
}
