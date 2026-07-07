/* eslint-disable no-console -- verbose AuthDB dbchange diagnostics */
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

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import * as settingsStore from '../../../data/settingsStore';

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
            walletId: payload.walletId,
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

        const { address, networkSymbol, metadata, walletId } = this.params;
        // Verbose diagnostics — prefixed so they're greppable in connect-cli output.
        const vlog = (...m: unknown[]) => console.log('[authDbUpdateAddress]', ...m);

        const [rows, oldEntry] = await Promise.all([
            provider.getAllEntries(walletId),
            provider.lookup(walletId, address, networkSymbol),
        ]);

        const newEntry: AuthLabelEntry = { metadata, counter: (oldEntry?.counter ?? 0) + 1 };
        const isInsert = oldEntry === null;

        vlog('ENTER', {
            walletId,
            address,
            networkSymbol,
            mode: this.useDevice ? 'device' : 'offline',
            op: isInsert ? 'INSERT/INIT' : 'UPDATE',
            localRows: rows.length,
            oldCounter: oldEntry?.counter ?? null,
            newCounter: newEntry.counter,
            metadata,
        });

        // Current locally-stored root before this operation (mirrors the device's own
        // stored_root log), so host and device roots can be compared side by side.
        const currentTreeState = await provider.getTreeState(walletId);
        vlog('current local root (before op)', {
            root: currentTreeState?.root ?? '(none — empty tree)',
            counter: currentTreeState?.counter ?? 0,
        });

        if (!this.useDevice) {
            await provider.upsert(walletId, address, networkSymbol, newEntry);
            const updatedRows = await provider.getAllEntries(walletId);
            const root = computeMerkleRoot(updatedRows);
            await provider.setTreeState(walletId, { root, counter: newEntry.counter });
            vlog('OFFLINE done', { counter: newEntry.counter, root });

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
        const approval = await provider.lookupApproval?.(walletId, address, networkSymbol);

        vlog('proof built', {
            oldValueHex: oldValueHex || '(empty)',
            newValueHex,
            proofLen: proof.length,
            proof,
            witnessAddress: nonMembership?.witnessAddress ?? null,
            witnessValue: nonMembership?.witnessValue
                ? bytesToHex(nonMembership.witnessValue)
                : null,
            witnessCounter: nonMembership?.witnessCounter ?? null,
            preApproval: approval ? { mac: approval.mac, deviceId: approval.deviceId } : null,
        });

        const cmd = this.getDevice().getCommands();
        vlog('-> AuthDbUpdateLeaf (device)');
        const response = await cmd.typedCall('AuthDbUpdateLeaf', 'AuthDbUpdateLeafResponse', {
            address: utf8Hex(address),
            old_value: oldValueHex,
            new_value: newValueHex,
            proof,
            ...(!isInsert && { old_counter: oldEntry.counter }),
            new_counter: newEntry.counter,
            ...(nonMembership?.witnessAddress !== null &&
                nonMembership?.witnessAddress !== undefined && {
                    witness_address: utf8Hex(nonMembership.witnessAddress),
                    witness_value: bytesToHex(nonMembership.witnessValue!),
                    witness_counter: nonMembership.witnessCounter!,
                }),
            ...(approval && { mac: approval.mac, device_id: approval.deviceId }),
        });
        vlog('<- AuthDbUpdateLeafResponse', {
            counter: response.message.counter,
            new_root: response.message.new_root,
            wallet_id: response.message.wallet_id,
            mac: response.message.mac,
        });

        // Defense in depth: the caller-supplied walletId scopes local storage, but only the
        // device's own echoed wallet_id proves which seed+passphrase was actually unlocked.
        if (response.message.wallet_id !== undefined && response.message.wallet_id !== walletId) {
            vlog('REJECT wallet_id mismatch', {
                deviceWalletId: response.message.wallet_id,
                requestedWalletId: walletId,
            });
            throw ERRORS.TypedError(
                'Runtime',
                `authDbUpdateAddress: device wallet_id (${response.message.wallet_id}) does not match requested walletId (${walletId})`,
            );
        }

        // The device already committed this update by the time we reach this point — a
        // failure below means the local cache is now stale, not that the operation failed.
        // Surface that as `localCacheError` on an otherwise-successful result instead of
        // throwing, so callers still get the device-confirmed counter/root and can decide
        // how to react (e.g. resync from getAllEntries()).
        let localCacheError: string | undefined;
        try {
            await provider.upsert(walletId, address, networkSymbol, newEntry);
            if (response.message.new_root !== undefined) {
                await provider.setTreeState(walletId, {
                    root: response.message.new_root,
                    counter: response.message.counter,
                    mac: response.message.mac,
                });
            }
            vlog('local cache updated (upsert + setTreeState)');
        } catch (err) {
            localCacheError = err instanceof Error ? err.message : String(err);
            vlog('LOCAL CACHE ERROR (device already committed)', localCacheError);
        }

        vlog('DONE', { counter: response.message.counter, root: response.message.new_root ?? '' });

        return {
            counter: response.message.counter,
            root: response.message.new_root ?? '',
            ...(localCacheError !== undefined && { localCacheError }),
        };
    }
}
