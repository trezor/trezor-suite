/* eslint-disable no-console -- verbose WARD bootstrap diagnostics */
import type { MethodPermission } from '@trezor/connect-common';
import { WardInitSchema } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getWardManagerService } from '../wardManagerService';
import { WardSession } from '../wardSession';

export default class WardInit extends AbstractMethod<'wardInit', WardInitSchema> {
    constructor(message: MethodMessage<'wardInit'>) {
        const { payload } = message;
        Assert(WardInitSchema, payload);

        const params = {
            counter: payload.counter,
            mac: payload.mac,
            root: payload.root,
            wardId: payload.wardId,
        };

        super(message, params);
        this.useDeviceState = false;
        this.useEmptyPassphrase = true;
    }

    get requiredPermissions(): MethodPermission[] {
        return ['management'];
    }

    get confirmation() {
        return {
            view: 'device-management' as const,
            label: 'Initialize the address database on the device?',
        };
    }

    get info() {
        return 'Initialize WARD state (sync round)';
    }

    async run() {
        const { counter, mac, root, wardId } = this.params;
        const vlog = (...m: unknown[]) => console.log('[wardInit]', ...m);
        const wardManager = getWardManagerService();
        const session = new WardSession(this.getDevice().getCommands(), vlog);

        // Sync round: WARDSync (device mints nonce + emits its ward_id) -> WM signs the
        // freshness attestation -> adopt (ingest + reconcile installs the state).
        const sync = await session.sync();
        if (sync.wardId === undefined) {
            throw ERRORS.TypedError('Runtime', 'wardInit: device did not return a ward_id');
        }
        // If the caller pinned a wardId it must match the device's own (proves which
        // seed+passphrase was unlocked); otherwise init LEARNS it from the device.
        if (wardId !== undefined && sync.wardId !== wardId) {
            throw ERRORS.TypedError(
                'Runtime',
                `wardInit: device ward_id (${sync.wardId}) does not match requested wardId (${wardId})`,
            );
        }
        const deviceWardId = sync.wardId;

        // TODO(handoff, gap 2): the WM signs the host-supplied (counter, mac). A hardened
        // WM must sign its OWN stored head — see gaps.md #2 / wardManagerService.
        // TODO(handoff, gap 3): validate (WM_HEAD, DB_HEAD) consistency host-side before
        // adopt, rather than relying on firmware to reject late at reconcile.
        const attestation = await wardManager.signAttestation({
            wardId: deviceWardId,
            nonce: sync.nonce,
            counter,
            mac,
        });
        const installed = await session.adopt({ counter, mac, wmSignature: attestation }, root);

        return {
            counter: installed.counter,
            root: installed.root ?? '',
            // Return the device-derived ward_id so the caller can cache it and pass it as
            // `wardId` to later update/verify calls.
            wardId: deviceWardId,
            ...(installed.rootMac !== undefined && { rootMac: installed.rootMac }),
        };
    }
}
