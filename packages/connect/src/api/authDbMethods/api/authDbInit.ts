/* eslint-disable no-console -- verbose AuthDB bootstrap diagnostics */
import type { MethodPermission } from '@trezor/connect-common';
import { AuthDbInitSchema } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getWardManagerService } from '../wardManagerService';

export default class AuthDbInit extends AbstractMethod<'authDbInit', AuthDbInitSchema> {
    constructor(message: MethodMessage<'authDbInit'>) {
        const { payload } = message;
        Assert(AuthDbInitSchema, payload);

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
        return 'Initialize AuthDB state (WARD sync round)';
    }

    async run() {
        const { counter, mac, root, wardId } = this.params;
        const vlog = (...m: unknown[]) => console.log('[authDbInit]', ...m);
        const wardManager = getWardManagerService();

        const cmd = this.getDevice().getCommands();

        // WARD sync round: WARDSync (device mints nonce) -> WM signs the freshness
        // attestation over (counter, mac) bound to the nonce -> IngestAttestation ->
        // Reconcile (device checks the root against the attested mac and installs it).
        vlog('-> WARDSync (device)');
        const init = await cmd.typedCall('WARDSync', 'WARDSyncAck', {});
        const { nonce, version, wallet_id: deviceWalletId, ward_id: deviceWardId } = init.message;
        vlog('<- WARDSyncAck', {
            nonce,
            version,
            wallet_id: deviceWalletId,
            ward_id: deviceWardId,
        });

        if (deviceWardId === undefined) {
            throw ERRORS.TypedError(
                'Runtime',
                'authDbInit: device did not return a ward_id for the sync round',
            );
        }
        // Defense in depth: if the caller pinned a wardId, the device's own
        // SLIP21-derived ward_id must match it (proves which seed+passphrase unlocked).
        if (wardId !== undefined && deviceWardId !== wardId) {
            throw ERRORS.TypedError(
                'Runtime',
                `authDbInit: device ward_id (${deviceWardId}) does not match requested wardId (${wardId})`,
            );
        }

        vlog('-> WARD Manager service: sign attestation', {
            ward_id: deviceWardId,
            nonce,
            counter,
            mac: mac ?? '(none)',
        });
        // The WM signs over the device-derived ward_id (not wallet_id).
        const wmSignature = await wardManager.signAttestation({
            wardId: deviceWardId,
            nonce,
            counter,
            mac,
        });
        vlog('<- WARD Manager service: attestation signature ready');

        vlog('-> WARDIngestAttestation (device)');
        const ingest = await cmd.typedCall('WARDIngestAttestation', 'WARDIngestAttestationAck', {
            counter,
            ...(mac !== undefined && { mac }),
            wm_signature: wmSignature,
        });
        vlog('<- WARDIngestAttestationAck', {
            counter: ingest.message.counter,
            wallet_id: ingest.message.wallet_id,
        });

        vlog('-> WARDReconcile (device)');
        const merge = await cmd.typedCall('WARDReconcile', 'WARDReconcileAck', {
            ...(root !== undefined && { root }),
        });
        vlog('<- WARDReconcileAck', {
            counter: merge.message.counter,
            new_root: merge.message.new_root,
            wallet_id: merge.message.wallet_id,
            root_mac: merge.message.root_mac,
        });

        return {
            counter: merge.message.counter,
            root: merge.message.new_root ?? '',
            // Return the device-derived ward_id (from WARDSyncAck) so the caller can
            // cache it and pass it as `wardId` to later update/verify calls.
            wardId: deviceWardId,
            ...(merge.message.root_mac !== undefined && { rootMac: merge.message.root_mac }),
        };
    }
}
