/* eslint-disable no-console -- verbose AuthDB bootstrap diagnostics */
// DEV/TEST-ONLY debug WM signer (stands in for the WARD Manager); see @trezor/authdb/mocks.
import { ZERO_MAC_HEX, signWmAttestation } from '@trezor/authdb/src/mocks';
import type { MethodPermission } from '@trezor/connect-common';
import { AuthDbInitSchema } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';

export default class AuthDbInit extends AbstractMethod<'authDbInit', AuthDbInitSchema> {
    constructor(message: MethodMessage<'authDbInit'>) {
        const { payload } = message;
        Assert(AuthDbInitSchema, payload);

        const params = {
            counter: payload.counter,
            mac: payload.mac,
            root: payload.root,
            walletId: payload.walletId,
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
        const { counter, mac, root, walletId } = this.params;
        const vlog = (...m: unknown[]) => console.log('[authDbInit]', ...m);

        const cmd = this.getDevice().getCommands();

        // WARD sync round: WARDSync (device mints nonce) -> WM signs the freshness
        // attestation over (counter, mac) bound to the nonce -> IngestAttestation ->
        // Reconcile (device checks the root against the attested mac and installs it).
        vlog('-> WARDSync (device)');
        const init = await cmd.typedCall('WARDSync', 'WARDSyncAck', {});
        const { nonce, version, wallet_id: deviceWalletId } = init.message;
        vlog('<- WARDSyncAck', { nonce, version, wallet_id: deviceWalletId });

        if (deviceWalletId === undefined) {
            throw ERRORS.TypedError(
                'Runtime',
                'authDbInit: device did not return a wallet_id for the sync round',
            );
        }
        if (walletId !== undefined && deviceWalletId !== walletId) {
            throw ERRORS.TypedError(
                'Runtime',
                `authDbInit: device wallet_id (${deviceWalletId}) does not match requested walletId (${walletId})`,
            );
        }

        // WM freshness attestation over the nonce-bound checkpoint. The debug QM signer
        // stands in for the WARD Manager; a real provisioned WM key is a follow-up.
        const macForSig = mac ?? ZERO_MAC_HEX;
        const wmSignature = signWmAttestation(deviceWalletId, nonce, counter, macForSig);

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
            ...(merge.message.wallet_id !== undefined && { walletId: merge.message.wallet_id }),
            ...(merge.message.root_mac !== undefined && { rootMac: merge.message.root_mac }),
        };
    }
}
