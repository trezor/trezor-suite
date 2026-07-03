import { bytesToHex } from '@noble/hashes/utils.js';

import {
    computeMerkleRoot,
    entryToValueBytes,
    generateMerkleProof,
    generateNonMembershipProof,
} from '@trezor/authdb';
import type { AuthLabelEntry } from '@trezor/authdb';
import type { MethodPermission } from '@trezor/connect-common';
import { AuthDbUpdateAddressSchema } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import * as settingsStore from '../data/settingsStore';

const utf8Hex = (s: string) => bytesToHex(new TextEncoder().encode(s));

export default class AuthDbUpdateAddress extends AbstractMethod<
    'authDbUpdateAddress',
    AuthDbUpdateAddressSchema
> {
    constructor(message: MethodMessage<'authDbUpdateAddress'>) {
        const { payload } = message;
        Assert(AuthDbUpdateAddressSchema, payload);

        const params = {
            address: payload.address,
            networkSymbol: payload.networkSymbol,
            metadata: payload.metadata,
        };

        super(message, params);
        // No `device` supplied means offline mode: persist locally and recompute the root
        // without a device round-trip (see run()). Auto-selecting a connected device is not
        // supported for this method — callers that want the device must name it explicitly.
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
        return 'Update AuthDB address entry';
    }

    async run() {
        const provider = settingsStore.get('authLabelLookupProvider');
        if (!provider) {
            throw ERRORS.TypedError(
                'Runtime',
                'authDbUpdateAddress requires authLabelLookupProvider to be set via TrezorConnect.init()',
            );
        }

        const { address, networkSymbol, metadata } = this.params;

        const [rows, oldEntry] = await Promise.all([
            provider.getAllEntries(),
            provider.lookup(address, networkSymbol),
        ]);

        const newEntry: AuthLabelEntry = { metadata, counter: (oldEntry?.counter ?? 0) + 1 };
        const isInsert = oldEntry === null;

        if (!this.useDevice) {
            await provider.upsert(address, networkSymbol, newEntry);
            const updatedRows = await provider.getAllEntries();
            const root = computeMerkleRoot(updatedRows);
            await provider.setTreeState({ root, counter: newEntry.counter });

            return { counter: newEntry.counter, root };
        }

        const oldValueHex = isInsert ? '' : bytesToHex(entryToValueBytes(networkSymbol, oldEntry));
        const newValueHex = bytesToHex(entryToValueBytes(networkSymbol, newEntry));

        const nonMembership = isInsert
            ? generateNonMembershipProof(rows, address, networkSymbol)
            : null;
        const proof = isInsert
            ? (nonMembership?.proof ?? [])
            : generateMerkleProof(rows, address, networkSymbol);

        // Auto-pick up a prior dbapprove-style pre-approval, if the provider supports it,
        // so callers don't need to plumb mac/deviceId through this call themselves.
        const approval = await provider.lookupApproval?.(address, networkSymbol);

        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('AuthDbUpdateLeaf', 'AuthDbUpdateLeafResponse', {
            address: utf8Hex(address),
            old_value: oldValueHex,
            new_value: newValueHex,
            proof,
            ...(nonMembership?.witnessAddress !== null &&
                nonMembership?.witnessAddress !== undefined && {
                    witness_address: utf8Hex(nonMembership.witnessAddress),
                    witness_value: bytesToHex(nonMembership.witnessValue!),
                }),
            ...(approval && { mac: approval.mac, device_id: approval.deviceId }),
        });

        // The device already committed this update by the time we reach this point — a
        // failure below means the local cache is now stale, not that the operation failed.
        // Surface that as `localCacheError` on an otherwise-successful result instead of
        // throwing, so callers still get the device-confirmed counter/root and can decide
        // how to react (e.g. resync from getAllEntries()).
        let localCacheError: string | undefined;
        try {
            await provider.upsert(address, networkSymbol, newEntry);
            if (response.message.new_root !== undefined) {
                await provider.setTreeState({
                    root: response.message.new_root,
                    counter: response.message.counter,
                });
            }
        } catch (err) {
            localCacheError = err instanceof Error ? err.message : String(err);
        }

        return {
            counter: response.message.counter,
            root: response.message.new_root ?? '',
            ...(localCacheError !== undefined && { localCacheError }),
        };
    }
}
