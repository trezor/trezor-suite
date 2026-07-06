import { bytesToHex } from '@noble/hashes/utils.js';

import {
    entryToValueBytes,
    generateMerkleProof,
    generateNonMembershipProof,
    valueHexToEntry,
} from '@trezor/authdb';
import type { AuthLabelRow, OfflineQueueConflict, OfflineQueueEntry } from '@trezor/authdb';
import type { MethodPermission } from '@trezor/connect-common';
import { AuthDbReplayQueueSchema } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import * as settingsStore from '../../../data/settingsStore';

const utf8Hex = (s: string) => bytesToHex(new TextEncoder().encode(s));

type RebasedCandidate = {
    sequence: number;
    address: string;
    old_value?: string;
    new_value?: string;
    mac: string;
    proof?: string[];
    witness_address?: string;
    witness_value?: string;
    entry: OfflineQueueEntry;
    networkSymbol: string;
};

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
        if (
            !provider.appendQueueEntries ||
            !provider.getQueueEntries ||
            !provider.clearQueueEntries
        ) {
            throw ERRORS.TypedError(
                'Runtime',
                'authDbReplayQueue requires a provider implementing OfflineQueueProvider',
            );
        }

        const { walletId } = this.params;
        const cmd = this.getDevice().getCommands();

        // 1. Drain whatever the device currently has queued.
        const drainResponse = await cmd.typedCall(
            'AuthDbGetOfflineOperations',
            'AuthDbGetOfflineOperationsResponse',
            {},
        );
        const drainedWalletId = drainResponse.message.wallet_id ?? walletId;
        if (drainedWalletId !== walletId) {
            throw ERRORS.TypedError(
                'Runtime',
                `authDbReplayQueue: device wallet_id (${drainedWalletId}) does not match requested walletId (${walletId})`,
            );
        }

        if (drainResponse.message.operations.length > 0) {
            const deviceId = this.getDevice().features?.device_id ?? '';
            await provider.appendQueueEntries(
                drainResponse.message.operations.map(op => ({
                    deviceId,
                    walletId: drainedWalletId,
                    mac: op.mac,
                    sequence: op.sequence,
                    address: op.address,
                    oldValue: op.old_value ?? '',
                    newValue: op.new_value ?? '',
                })),
            );
        }

        // 2. Work from the host's own persisted queue (ascending sequence), so a prior
        // interrupted run's not-yet-applied entries are picked back up too.
        const entries = await provider.getQueueEntries(walletId);

        const initialTreeState = await provider.getTreeState(walletId);
        let lastCounter = initialTreeState?.counter ?? 0;
        let lastRoot = initialTreeState?.root ?? '';

        if (entries.length === 0) {
            return { appliedCount: 0, counter: lastCounter, root: lastRoot, conflicts: [] };
        }

        // 3. Rebase against canonical state, detecting conflicts. Operations must be
        // checked in ascending sequence order: the device itself stops applying a batch
        // at the first failure, so sending a known-stale operation would silently block
        // every valid operation after it.
        const canonicalRows = await provider.getAllEntries(walletId);
        const rows: AuthLabelRow[] = [...canonicalRows];
        const canonicalValue = new Map<string, string>();
        rows.forEach(row => {
            canonicalValue.set(
                row.address,
                bytesToHex(entryToValueBytes(row.networkSymbol, row.entry)),
            );
        });

        const candidates: RebasedCandidate[] = [];
        const conflicts: OfflineQueueConflict[] = [];

        for (const entry of entries) {
            const isDelete = entry.newValue === '';
            const isInsert = entry.oldValue === '';
            const { networkSymbol } = valueHexToEntry(isDelete ? entry.oldValue : entry.newValue);

            const currentValue = canonicalValue.get(entry.address) ?? '';
            if (currentValue !== entry.oldValue) {
                conflicts.push({
                    entry,
                    reason: 'stale old_value: canonical state has moved on',
                });
                break;
            }

            const nonMembership = isInsert
                ? generateNonMembershipProof(rows, entry.address, networkSymbol)
                : null;
            const proof = isInsert
                ? (nonMembership?.proof ?? [])
                : generateMerkleProof(rows, entry.address, networkSymbol);

            candidates.push({
                sequence: entry.sequence,
                address: entry.address,
                old_value: entry.oldValue,
                new_value: entry.newValue,
                mac: entry.mac,
                proof,
                ...(nonMembership?.witnessAddress !== null &&
                    nonMembership?.witnessAddress !== undefined && {
                        witness_address: nonMembership.witnessAddress,
                        witness_value: bytesToHex(nonMembership.witnessValue!),
                    }),
                entry,
                networkSymbol,
            });

            // Simulate applying this op so the NEXT op's staleness check and proof
            // reflect it, matching the order the device will actually apply them in.
            const rowIndex = rows.findIndex(r => r.address === entry.address);
            if (isDelete) {
                canonicalValue.delete(entry.address);
                if (rowIndex >= 0) rows.splice(rowIndex, 1);
            } else {
                const { entry: decoded } = valueHexToEntry(entry.newValue);
                canonicalValue.set(entry.address, entry.newValue);
                const row = { address: entry.address, networkSymbol, entry: decoded };
                if (rowIndex >= 0) rows[rowIndex] = row;
                else rows.push(row);
            }
        }

        if (candidates.length === 0) {
            return { appliedCount: 0, counter: lastCounter, root: lastRoot, conflicts };
        }

        // 4. Apply the conflict-free prefix in one batch.
        const applyResponse = await cmd.typedCall(
            'AuthDbApplyOfflineOperations',
            'AuthDbApplyOfflineOperationsResponse',
            {
                operations: candidates.map(c => ({
                    sequence: c.sequence,
                    address: utf8Hex(c.address),
                    old_value: c.old_value,
                    new_value: c.new_value,
                    mac: c.mac,
                    proof: c.proof,
                    ...(c.witness_address !== undefined && {
                        witness_address: utf8Hex(c.witness_address),
                        witness_value: c.witness_value,
                    }),
                })),
            },
        );

        if (
            applyResponse.message.wallet_id !== undefined &&
            applyResponse.message.wallet_id !== walletId
        ) {
            throw ERRORS.TypedError(
                'Runtime',
                `authDbReplayQueue: device wallet_id (${applyResponse.message.wallet_id}) does not match requested walletId (${walletId})`,
            );
        }

        const {
            applied_count: appliedCount,
            new_root: newRoot,
            counter,
            root_mac: rootMac,
        } = applyResponse.message;

        // 5. Persist only what the device actually confirmed applying.
        for (const candidate of candidates.slice(0, appliedCount)) {
            if (candidate.new_value !== '') {
                const { entry: decodedEntry } = valueHexToEntry(candidate.new_value ?? '');
                await provider.upsert(
                    walletId,
                    candidate.address,
                    candidate.networkSymbol,
                    decodedEntry,
                );
            }
            // Deletions aren't representable via AuthLabelLookupProvider (no delete method) —
            // the tree state below still advances since the device already applied it.
        }

        lastRoot = newRoot ?? lastRoot;
        lastCounter = counter;
        await provider.setTreeState(walletId, {
            root: lastRoot,
            counter: lastCounter,
            mac: rootMac,
        });

        await provider.clearQueueEntries(walletId, applyResponse.message.last_applied_sequence);

        if (appliedCount > 0) {
            // Safe now: the sqlite writes above already landed before this call, matching
            // the protocol's persistence-before-deletion invariant.
            await cmd.typedCall(
                'AuthDbDeleteOfflineOperations',
                'AuthDbDeleteOfflineOperationsResponse',
                {},
            );
        }

        return { appliedCount, counter: lastCounter, root: lastRoot, conflicts };
    }
}
