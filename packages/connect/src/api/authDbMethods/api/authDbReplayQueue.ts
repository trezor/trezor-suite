import { bytesToHex } from '@noble/hashes/utils.js';

import { generateMerkleProof, generateNonMembershipProof, valueHexToEntry } from '@trezor/authdb';
import type { MethodPermission } from '@trezor/connect-common';
import { AuthDbReplayQueueSchema } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import * as settingsStore from '../../../data/settingsStore';

const utf8Hex = (s: string) => bytesToHex(new TextEncoder().encode(s));

export default class AuthDbReplayQueue extends AbstractMethod<
    'authDbReplayQueue',
    AuthDbReplayQueueSchema
> {
    constructor(message: MethodMessage<'authDbReplayQueue'>) {
        const { payload } = message;
        Assert(AuthDbReplayQueueSchema, payload);

        const params = {
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
            label: 'Replay this wallet’s queued entries onto the device?',
        };
    }

    get info() {
        return 'Replay AuthDB offline queue (full sync)';
    }

    async run() {
        const provider = settingsStore.get('authLabelLookupProvider');
        if (!provider) {
            throw ERRORS.TypedError(
                'Runtime',
                'authDbReplayQueue requires authLabelLookupProvider to be set via TrezorConnect.init()',
            );
        }
        if (!provider.getQueueEntries || !provider.clearQueueEntries) {
            throw ERRORS.TypedError(
                'Runtime',
                'authDbReplayQueue requires a provider implementing OfflineQueueProvider',
            );
        }

        const { walletId } = this.params;
        const cmd = this.getDevice().getCommands();

        const entries = await provider.getQueueEntries(walletId);

        const initialTreeState = await provider.getTreeState(walletId);
        let appliedCount = 0;
        let lastCounter = initialTreeState?.counter ?? 0;
        let lastRoot = initialTreeState?.root ?? '';

        // Entries clear from the queue only after the device confirms them — a failure
        // partway through leaves the remaining (and the failed) entry queued for retry,
        // while everything applied so far is already persisted.
        for (const entry of entries) {
            const isDelete = entry.newValue === '';
            const isInsert = entry.oldValue === '';
            const { networkSymbol } = valueHexToEntry(isDelete ? entry.oldValue : entry.newValue);

            const rows = await provider.getAllEntries(walletId);
            const nonMembership = isInsert
                ? generateNonMembershipProof(rows, entry.address, networkSymbol)
                : null;
            const proof = isInsert
                ? (nonMembership?.proof ?? [])
                : generateMerkleProof(rows, entry.address, networkSymbol);

            const response = await cmd.typedCall('AuthDbUpdateLeaf', 'AuthDbUpdateLeafResponse', {
                address: utf8Hex(entry.address),
                old_value: entry.oldValue,
                new_value: entry.newValue,
                proof,
                ...(nonMembership?.witnessAddress !== null &&
                    nonMembership?.witnessAddress !== undefined && {
                        witness_address: utf8Hex(nonMembership.witnessAddress),
                        witness_value: bytesToHex(nonMembership.witnessValue!),
                    }),
                mac: entry.mac,
                device_id: entry.deviceId,
            });

            if (!isDelete) {
                const { entry: decodedEntry } = valueHexToEntry(entry.newValue);
                await provider.upsert(walletId, entry.address, networkSymbol, decodedEntry);
            }
            // Deletions aren't representable via AuthLabelLookupProvider (no delete method) —
            // the tree state below still advances since the device already applied it.

            if (response.message.new_root !== undefined) {
                lastRoot = response.message.new_root;
                lastCounter = response.message.counter;
                await provider.setTreeState(walletId, { root: lastRoot, counter: lastCounter });
            }

            await provider.clearQueueEntries(walletId, entry.sequence);
            appliedCount += 1;
        }

        return { appliedCount, counter: lastCounter, root: lastRoot };
    }
}
