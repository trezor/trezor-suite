/**
 * @trezor/authdb/sync — offline-queue sync engine (drain -> rebase -> replay -> persist)
 * plus fast-forward, extracted from connect's authDbReplayQueue / authDbFastForwardRoot.
 *
 * The engine is transport-agnostic: it talks to the device only through an injected
 * AuthDbDeviceClient, so the same code can drive an Evolu-mediated sync today or a BLE
 * peer relay later. @trezor/connect provides the client (backed by cmd.typedCall) and
 * maps AuthDbSyncError into its own error type.
 *
 * NOTE: this is a straight refactor of the shipped behaviour — the conflict handling is
 * still the host-side pre-pass (stop at the first stale op). The device-confirmed
 * resolution described in docs/authdb-suite-architecture.md is a separate, later change.
 */
import { bytesToHex } from '@noble/hashes/utils.js';

import {
    entryToValueBytes,
    generateMerkleProof,
    generateNonMembershipProof,
    valueHexToEntry,
} from '../proof';
import type { AuthLabelProvider } from '../storage';
import type { AuthLabelRow, OfflineQueueConflict, OfflineQueueEntry } from '../types';

const utf8Hex = (s: string) => bytesToHex(new TextEncoder().encode(s));

// ---------------------------------------------------------------------------
// Wire-boundary DTOs (structural mirror of the firmware protobuf messages, so /sync
// stays free of a @trezor/protobuf dependency). The connect client forwards these
// verbatim to cmd.typedCall.
// ---------------------------------------------------------------------------

export type WireOfflineOperation = {
    sequence: number;
    address: string;
    old_value?: string;
    new_value?: string;
    mac: string;
    old_counter?: number;
    new_counter: number;
};

export type GetOfflineOperationsResponse = {
    wallet_id?: string;
    current_root?: string;
    counter: number;
    operations: WireOfflineOperation[];
};

export type WireRebasedOperation = {
    sequence: number;
    address: string;
    old_value?: string;
    new_value?: string;
    mac: string;
    proof?: string[];
    witness_address?: string;
    witness_value?: string;
    witness_counter?: number;
    old_counter?: number;
    new_counter: number;
};

export type ApplyOfflineOperationsResponse = {
    applied_count: number;
    new_root?: string;
    counter: number;
    last_applied_sequence: number;
    wallet_id?: string;
    root_mac?: string;
};

export type FastForwardRootRequest = {
    new_root: string;
    counter: number;
    wallet_id: string;
    mac: string;
};

export type FastForwardRootResponse = {
    new_root?: string;
    counter: number;
    wallet_id?: string;
};

/**
 * Transport abstraction over the device's AuthDb RPCs. Implemented by @trezor/connect on
 * top of cmd.typedCall; a BLE relay would implement the same interface.
 */
export interface AuthDbDeviceClient {
    /** features.device_id of the connected device, attached to persisted queue rows. */
    readonly deviceId: string;
    getOfflineOperations(): Promise<GetOfflineOperationsResponse>;
    applyOfflineOperations(
        operations: WireRebasedOperation[],
    ): Promise<ApplyOfflineOperationsResponse>;
    deleteOfflineOperations(): Promise<void>;
    fastForwardRoot(request: FastForwardRootRequest): Promise<FastForwardRootResponse>;
}

/** Thrown for host-side invariant violations (e.g. wallet_id mismatch). The connect shell
 * maps this to its own Runtime error type. */
export class AuthDbSyncError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthDbSyncError';
    }
}

export type ReplayQueueResult = {
    appliedCount: number;
    counter: number;
    root: string;
    conflicts: OfflineQueueConflict[];
};

type RebasedCandidate = {
    sequence: number;
    address: string;
    old_value?: string;
    new_value?: string;
    mac: string;
    proof?: string[];
    witness_address?: string;
    witness_value?: string;
    witness_counter?: number;
    old_counter?: number;
    new_counter: number;
    entry: OfflineQueueEntry;
    networkSymbol: string;
};

/**
 * Drain the device's offline queue, rebase it against the host's canonical state, apply
 * the conflict-free prefix, persist the results, and GC the applied ops on-device.
 * Faithful port of connect's authDbReplayQueue.run().
 */
export const replayQueue = async ({
    provider,
    device,
    walletId,
}: {
    provider: AuthLabelProvider;
    device: AuthDbDeviceClient;
    walletId: string;
}): Promise<ReplayQueueResult> => {
    if (!provider.appendQueueEntries || !provider.getQueueEntries || !provider.clearQueueEntries) {
        throw new AuthDbSyncError(
            'authDbReplayQueue requires a provider implementing OfflineQueueProvider',
        );
    }

    // 1. Drain whatever the device currently has queued.
    const drainResponse = await device.getOfflineOperations();
    const drainedWalletId = drainResponse.wallet_id ?? walletId;
    if (drainedWalletId !== walletId) {
        throw new AuthDbSyncError(
            `authDbReplayQueue: device wallet_id (${drainedWalletId}) does not match requested walletId (${walletId})`,
        );
    }

    if (drainResponse.operations.length > 0) {
        await provider.appendQueueEntries!(
            drainResponse.operations.map(op => ({
                deviceId: device.deviceId,
                walletId: drainedWalletId,
                mac: op.mac,
                sequence: op.sequence,
                address: op.address,
                oldValue: op.old_value ?? '',
                newValue: op.new_value ?? '',
                oldCounter: op.old_counter,
                newCounter: op.new_counter,
            })),
        );
    }

    // 2. Work from the host's own persisted queue (ascending sequence), so a prior
    // interrupted run's not-yet-applied entries are picked back up too.
    const entries = await provider.getQueueEntries!(walletId);

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
            conflicts.push({ entry, reason: 'stale old_value: canonical state has moved on' });
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
                    witness_counter: nonMembership.witnessCounter!,
                }),
            ...(!isInsert && { old_counter: entry.oldCounter }),
            new_counter: entry.newCounter,
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
    const applyResponse = await device.applyOfflineOperations(
        candidates.map(c => ({
            sequence: c.sequence,
            address: utf8Hex(c.address),
            old_value: c.old_value,
            new_value: c.new_value,
            mac: c.mac,
            proof: c.proof,
            ...(c.old_counter !== undefined && { old_counter: c.old_counter }),
            new_counter: c.new_counter,
            ...(c.witness_address !== undefined && {
                witness_address: utf8Hex(c.witness_address),
                witness_value: c.witness_value,
                witness_counter: c.witness_counter,
            }),
        })),
    );

    if (applyResponse.wallet_id !== undefined && applyResponse.wallet_id !== walletId) {
        throw new AuthDbSyncError(
            `authDbReplayQueue: device wallet_id (${applyResponse.wallet_id}) does not match requested walletId (${walletId})`,
        );
    }

    const {
        applied_count: appliedCount,
        new_root: newRoot,
        counter,
        root_mac: rootMac,
    } = applyResponse;

    // 5. Persist only what the device actually confirmed applying.
    const initialCounter = lastCounter;
    const appliedCandidates = candidates.slice(0, appliedCount);
    for (const [index, candidate] of appliedCandidates.entries()) {
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

        // Cross-device history/audit log, if the provider retains one — the device itself
        // has no history, so this only ever exists host-side (optional extension).
        if (provider.recordHistoryEntry) {
            await provider.recordHistoryEntry({
                walletId,
                address: candidate.address,
                networkSymbol: candidate.networkSymbol,
                deviceId: candidate.entry.deviceId,
                oldValue: candidate.old_value ?? '',
                newValue: candidate.new_value ?? '',
                oldCounter: candidate.entry.oldCounter,
                newCounter: candidate.entry.newCounter,
                // The device increments its root counter by exactly one per applied
                // operation; the response only returns the final counter, so this is
                // derived rather than read from the wire.
                appliedAtRootCounter: initialCounter + index + 1,
            });
        }
    }

    lastRoot = newRoot ?? lastRoot;
    lastCounter = counter;
    await provider.setTreeState(walletId, { root: lastRoot, counter: lastCounter, mac: rootMac });

    await provider.clearQueueEntries!(walletId, applyResponse.last_applied_sequence);

    if (appliedCount > 0) {
        // Safe now: the persistence writes above already landed before this call, matching
        // the protocol's persistence-before-deletion invariant.
        await device.deleteOfflineOperations();
    }

    return { appliedCount, counter: lastCounter, root: lastRoot, conflicts };
};

export type FastForwardResult = { counter: number; walletId?: string };

/**
 * Fast-forward the device to the wallet's stored, attested root. Faithful port of
 * connect's authDbFastForwardRoot.run().
 */
export const fastForwardRoot = async ({
    provider,
    device,
    walletId,
}: {
    provider: AuthLabelProvider;
    device: AuthDbDeviceClient;
    walletId: string;
}): Promise<FastForwardResult> => {
    const treeState = await provider.getTreeState(walletId);
    if (!treeState) {
        throw new AuthDbSyncError(
            'authDbFastForwardRoot: no stored root for this wallet — run authDbUpdateAddress or authDbReplayQueue first',
        );
    }
    if (treeState.mac === undefined) {
        throw new AuthDbSyncError(
            'authDbFastForwardRoot: no root-attestation token for this wallet — run authDbUpdateAddress or authDbReplayQueue first',
        );
    }

    const response = await device.fastForwardRoot({
        new_root: treeState.root,
        counter: treeState.counter,
        wallet_id: walletId,
        mac: treeState.mac,
    });

    await provider.setTreeState(walletId, {
        root: response.new_root ?? treeState.root,
        counter: response.counter,
        mac: treeState.mac,
    });

    return { counter: response.counter, walletId: response.wallet_id };
};
