/* eslint-disable no-console -- verbose WARD display diagnostics */
import type { MethodPermission } from '@trezor/connect-common';
import { WardDisplayAddressSchema } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';
import { blobRows, loadHead } from '@trezor/ward';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import * as settingsStore from '../../../data/settingsStore';
import { buildAckByKey } from '../proofAck';
import { getWardManagerService } from '../wardManagerService';
import { WardSession } from '../wardSession';

export default class WardDisplayAddress extends AbstractMethod<
    'wardDisplayAddress',
    WardDisplayAddressSchema
> {
    constructor(message: MethodMessage<'wardDisplayAddress'>) {
        const { payload } = message;
        Assert(WardDisplayAddressSchema, payload);

        const params = {
            appId: payload.appId,
            address: payload.address,
            networkSymbol: payload.networkSymbol,
            wardId: payload.wardId,
        };

        super(message, params);
        // Displaying the label is inherently a device action — a device must be named
        // explicitly (no offline mode, no auto-select, matching the other WARD methods).
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
            label: 'Show this address with its WARD label on the device?',
        };
    }

    get info() {
        return 'Show WARD address with label';
    }

    async run() {
        if (!this.useDevice) {
            throw ERRORS.TypedError('Runtime', 'wardDisplayAddress requires a device');
        }
        const provider = settingsStore.get('wardDataProvider');
        if (!provider) {
            throw ERRORS.TypedError(
                'Runtime',
                'wardDisplayAddress requires wardDataProvider to be set via TrezorConnect.init()',
            );
        }
        const wardManager = getWardManagerService();
        const { appId, address, networkSymbol, wardId } = this.params;
        const vlog = (...m: unknown[]) => console.log('[wardDisplayAddress]', ...m);

        // Application flow: resolve DB state + build the proof the device will pull.
        const { rows, tree } = await loadHead(provider, wardId);
        if (tree?.root && rows.length === 0) {
            console.warn(
                `[wardDisplayAddress] INCONSISTENT host state for wardId=${wardId}: tree_state root ` +
                    `present (counter ${tree.counter}) but 0 address rows — the label proof will be empty. ` +
                    'The provider likely failed to persist entries.',
            );
        }
        const entry = await provider.lookup(wardId, appId, address, networkSymbol);
        const isMember = entry !== null;
        const preBlobs = blobRows(rows);
        vlog('ENTER', {
            wardId,
            appId,
            address,
            networkSymbol,
            isMember,
            rows: rows.length,
        });

        const session = new WardSession(this.getDevice().getCommands(), vlog);

        // Bootstrap: install the host's current authenticated root so the device has a
        // root to verify the label against — without it, lookup rejects with "no
        // authenticated root in session". Same sync round wardUpdate uses.
        const sync = await session.sync();
        WardSession.assertWardId(sync.wardId, wardId, 'wardDisplayAddress');
        // TODO(handoff, gap 2): the WM signs the host-supplied (counter, mac) — see gaps.md #2.
        const attestation = await wardManager.signAttestation({
            wardId,
            nonce: sync.nonce,
            counter: tree?.counter ?? 0,
            mac: tree?.mac,
        });
        await session.adopt(
            { counter: tree?.counter ?? 0, mac: tree?.mac, wmSignature: attestation },
            tree?.root,
        );

        // WARD flow: the device pulls the proof BY the entry_key it computed; we answer
        // reactively from the host's stored leaf blobs, and the device verifies it
        // against the adopted root and renders the label on the trusted address screen.
        await session.displayAddress({ address, app_id: appId }, req =>
            buildAckByKey(preBlobs, req.entry_key),
        );

        return { shown: true, isMember };
    }
}
