/* eslint-disable require-await -- async test-mock methods satisfy the Promise-returning
   AuthDbDeviceClient interface without needing an await */
import { bytesToHex } from '@noble/hashes/utils.js';

import { entryToValueBytes } from '../proof';
import { InMemoryAuthLabelDb } from '../storage';
import { replayQueue } from '../sync';
import type { AuthDbDeviceClient, WireRebasedOperation } from '../sync';
import type { ConflictAdvice, OfflineQueueEntry, SignedConflictResolution } from '../types';

const NS = 'TEST';
const hex = (label: string, counter: number) =>
    bytesToHex(entryToValueBytes(NS, { metadata: { label }, counter }));

const seedQueueEntry = (over: Partial<OfflineQueueEntry> = {}): OfflineQueueEntry => ({
    deviceId: 'dev',
    walletId: 'w',
    mac: 'opmac',
    sequence: 1,
    address: 'a',
    oldValue: '',
    newValue: hex('op', 1),
    newCounter: 1,
    ...over,
});

type Resolver = (advice: ConflictAdvice) => Promise<SignedConflictResolution>;

// Device client whose apply echoes applied_count = number submitted and records the
// rebased ops + resolveConflict advices, so tests can assert on them. A resolver makes
// the device conflict-resolution-capable; omit it to model a device that cannot resolve.
const buildDevice = (resolver?: Resolver) => {
    const applied: WireRebasedOperation[][] = [];
    const resolveCalls: ConflictAdvice[] = [];
    const device: AuthDbDeviceClient & {
        applied: WireRebasedOperation[][];
        resolveCalls: ConflictAdvice[];
    } = {
        deviceId: 'dev',
        applied,
        resolveCalls,
        getOfflineOperations: async () => ({ counter: 0, operations: [] }),
        applyOfflineOperations: async operations => {
            applied.push(operations);

            return {
                applied_count: operations.length,
                new_root: 'root_after',
                counter: 9,
                last_applied_sequence: operations[operations.length - 1]?.sequence ?? 0,
                root_mac: 'mac_after',
            };
        },
        deleteOfflineOperations: async () => undefined,
        fastForwardRoot: async () => ({ counter: 9 }),
        ...(resolver && {
            resolveConflict: async (advice: ConflictAdvice) => {
                resolveCalls.push(advice);

                return resolver(advice);
            },
        }),
    };

    return device;
};

// A resolver that signs the resolved transition the engine proposed (last-writer-wins).
const echoResolver: Resolver = async advice => ({
    address: advice.address,
    resolved_old_value: advice.proof.canonical_value,
    resolved_old_counter: advice.proof.canonical_counter,
    resolved_new_value: advice.resolved_new_value,
    resolved_new_counter: advice.resolved_new_counter,
    mac: 'RESMAC',
});

const seedCanonicalConflict = (provider: InMemoryAuthLabelDb) => {
    // canonical has 'a' at counter 2; the queued op assumed a stale counter-1 base
    provider.upsert('w', 'a', NS, { metadata: { label: 'canon' }, counter: 2 });
    provider.setTreeState('w', { root: 'R', counter: 2, mac: 'M' });

    return provider.appendQueueEntries([
        seedQueueEntry({
            oldValue: hex('stale', 1),
            newValue: hex('op', 2),
            oldCounter: 1,
            newCounter: 2,
        }),
    ]);
};

describe('replayQueue', () => {
    it('applies a non-conflicting insert without invoking conflict resolution', async () => {
        const provider = new InMemoryAuthLabelDb();
        await provider.appendQueueEntries([seedQueueEntry()]); // empty canonical -> insert
        const device = buildDevice(async () => {
            throw new Error('should not resolve');
        });

        const result = await replayQueue({ provider, device, walletId: 'w' });

        expect(result.appliedCount).toBe(1);
        expect(result.conflicts).toEqual([]);
        expect(device.resolveCalls).toHaveLength(0);
        expect(device.applied[0]?.[0]?.conflict_resolution).toBeUndefined();
        expect(provider.lookup('w', 'a', NS)?.metadata.label).toBe('op');
    });

    it('stops at the first conflict when the device cannot resolve (backward-compatible)', async () => {
        const provider = new InMemoryAuthLabelDb();
        await seedCanonicalConflict(provider);
        const device = buildDevice(); // no resolver -> not capable

        const result = await replayQueue({ provider, device, walletId: 'w' });

        expect(result.appliedCount).toBe(0);
        expect(result.conflicts).toHaveLength(1);
        expect(device.applied).toHaveLength(0);
    });

    it('resolves a conflict on-device, attaches the signed record, and persists it', async () => {
        const provider = new InMemoryAuthLabelDb();
        await seedCanonicalConflict(provider);
        const device = buildDevice(echoResolver);

        const result = await replayQueue({ provider, device, walletId: 'w' });

        expect(device.resolveCalls).toHaveLength(1);
        expect(device.resolveCalls[0]?.resolved_new_counter).toBe(3); // canonical counter 2 -> 3
        expect(result.appliedCount).toBe(1);
        const op = device.applied[0]?.[0];
        expect(op?.conflict_resolution?.mac).toBe('RESMAC');
        expect(op?.old_value).toBe(hex('canon', 2)); // rebased onto current canonical
        expect(op?.new_value).toBe(hex('op', 3));
        expect(provider.getConflictResolution('w', 'a', NS, 1)?.mac).toBe('RESMAC');
    });

    it('reuses a stored resolution without re-prompting the device (dedup)', async () => {
        const provider = new InMemoryAuthLabelDb();
        await seedCanonicalConflict(provider);
        provider.putConflictResolution('w', 'a', NS, 1, {
            address: 'a',
            resolved_old_value: hex('canon', 2),
            resolved_old_counter: 2,
            resolved_new_value: hex('op', 3),
            resolved_new_counter: 3,
            mac: 'STORED',
        });
        const device = buildDevice(async () => {
            throw new Error('should reuse stored record');
        });

        const result = await replayQueue({ provider, device, walletId: 'w' });

        expect(device.resolveCalls).toHaveLength(0);
        expect(result.appliedCount).toBe(1);
        expect(device.applied[0]?.[0]?.conflict_resolution?.mac).toBe('STORED');
    });
});
