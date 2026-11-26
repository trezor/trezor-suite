import { ERRORS } from '@trezor/connect-common/src/constants';
import {
    type RelayDevice,
    RelayFailure,
    type RelayMessage,
    type WardRelay,
    type WardRelayEndpoint,
} from '@trezor/ward';

import * as settingsStore from '../../../data/settingsStore';
import {
    WARD_SIGNING_PROOF_TIMEOUT,
    WARD_SIGNING_SYNC_TIMEOUT,
    callWard,
    withSyncedWard,
    withWard,
} from '../wardAdapter';

/** A device session: `relayCall` answers by name; a pull goes through the registered callback. */
const fakeCmd = (answers: Record<string, () => Promise<{ type: string; message: any }>>) => {
    let proofCallback: ((request: any) => any) | undefined;
    let nodeCallback: ((request: any) => any) | undefined;
    const cmd = {
        relayCall: jest.fn((name: string, _msg: Record<string, unknown>) => answers[name]!()),
        setWardProofCallback: jest.fn(cb => {
            proofCallback = cb;
        }),
        setWardNodeCallback: jest.fn(cb => {
            nodeCallback = cb;
        }),
        typedCall: jest.fn(),
        pull: (request: Record<string, unknown>) => proofCallback!(request),
        pullNodes: (request: Record<string, unknown>) => nodeCallback!(request),
    };

    return cmd;
};

/** A wardd stand-in whose one conversation is the given script. */
const fakeWardd = (
    script: (relay: RelayDevice, endpoint: WardRelayEndpoint) => Promise<Record<string, unknown>>,
) => {
    const calls: { method: string; params: Record<string, unknown> }[] = [];
    const endpoint: WardRelayEndpoint = {
        call: jest.fn((method, params = {}, device) => {
            calls.push({ method, params });
            if (method === 'answerProofRequest')
                return Promise.resolve({ proof: [], content: null, x: {} });
            if (method === 'answerNodeRequest')
                return Promise.resolve({ entries: [{ entry_key: 'ee', content: null }] });

            return script(device!, endpoint);
        }),
        close: jest.fn(),
    };
    const wardd: WardRelay = { connect: () => Promise.resolve(endpoint) };

    return { wardd, endpoint, calls };
};

const setWardd = (wardd?: WardRelay) => settingsStore.set({ wardd } as any);

describe('the Connect WARD adapter', () => {
    it("carries wardd's messages to the device and the answers back, in relay form", async () => {
        const cmd = fakeCmd({
            WARDSync: () =>
                Promise.resolve({
                    type: 'WARDSyncAck',
                    message: { nonce: 'aa', version: 1, ward_id: 'cd', unset: null, empty: {} },
                }),
        });
        const seen: RelayMessage[] = [];
        const { wardd, endpoint } = fakeWardd(async relay => {
            seen.push(await relay({ name: 'WARDSync', message: { absent: null } }));

            return { wardId: 'cd', counter: 0, root: '' };
        });
        setWardd(wardd);

        const result = await callWard<{ wardId: string }>(cmd as any, 'wardInit', 'sync', {});

        expect(result.wardId).toBe('cd');
        // absent fields never cross: not toward the device, not back to wardd
        expect(cmd.relayCall).toHaveBeenCalledWith('WARDSync', {});
        expect(seen).toEqual([
            { name: 'WARDSyncAck', message: { nonce: 'aa', version: 1, ward_id: 'cd' } },
        ]);
        expect(endpoint.close).toHaveBeenCalled();
        expect(cmd.setWardProofCallback).toHaveBeenLastCalledWith(undefined);
        expect(cmd.setWardNodeCallback).toHaveBeenLastCalledWith(undefined);
    });

    it('answers a proof pull wardd cannot serve as unavailable', async () => {
        const cmd = fakeCmd({});
        const endpoint: WardRelayEndpoint = {
            call: jest.fn(() => Promise.reject(new RelayFailure('no_store', 'sync first'))),
            close: jest.fn(),
        };
        setWardd({ connect: () => Promise.resolve(endpoint) });

        const ack = await withWard(cmd as any, 'wardDisplayAddress', () =>
            cmd.pull({ entry_key: 'ee' }),
        );

        expect(ack).toEqual({ unavailable: true });
    });

    it("answers a listing walk's entry pull through wardd's answerNodeRequest", async () => {
        const cmd = fakeCmd({});
        const { wardd, calls } = fakeWardd(() => Promise.resolve({}));
        setWardd(wardd);

        const ack = await withWard(cmd as any, 'wardList', () =>
            cmd.pullNodes({ after: 'ab', absent: null }),
        );

        expect(calls).toEqual([
            { method: 'answerNodeRequest', params: { request: { after: 'ab' } } },
        ]);
        expect(ack).toEqual({ entries: [{ entry_key: 'ee' }] });
    });

    it("answers the device's proof pull through wardd's answerProofRequest", async () => {
        const cmd = fakeCmd({});
        const { wardd, calls } = fakeWardd(() => Promise.resolve({}));
        setWardd(wardd);

        const ack = await withWard(cmd as any, 'wardLookup', () =>
            cmd.pull({ entry_key: 'ee', pending_id: null }),
        );

        expect(calls).toEqual([
            { method: 'answerProofRequest', params: { request: { entry_key: 'ee' } } },
        ]);
        expect(ack).toEqual({ proof: [] });
    });

    it('hands a device Failure to wardd instead of ending the call', async () => {
        const cmd = fakeCmd({
            WARDSync: () =>
                Promise.reject(ERRORS.TypedError('Failure_ActionCancelled', 'cancelled')),
        });
        let reply: RelayMessage | undefined;
        const { wardd } = fakeWardd(async relay => {
            reply = await relay({ name: 'WARDSync', message: {} });

            return {};
        });
        setWardd(wardd);

        await callWard(cmd as any, 'wardInit', 'sync', {});

        expect(reply).toEqual({
            name: 'Failure',
            message: { code: 'Failure_ActionCancelled', message: 'cancelled' },
        });
    });

    it("turns wardd's refusal into a Connect error naming its code", async () => {
        const cmd = fakeCmd({});
        const { wardd, endpoint } = fakeWardd(() =>
            Promise.reject(new RelayFailure('ward_id_mismatch', 'wrong wallet')),
        );
        setWardd(wardd);

        await expect(callWard(cmd as any, 'wardInit', 'sync', {})).rejects.toThrow(
            'wardd ward_id_mismatch: wrong wallet',
        );
        expect(endpoint.close).toHaveBeenCalled();
    });

    it('requires wardd to be configured', async () => {
        setWardd(undefined);

        await expect(callWard(fakeCmd({}) as any, 'wardInit', 'sync', {})).rejects.toThrow(
            'wardInit requires wardd',
        );
    });
});

describe('the per-conversation relay allowlist', () => {
    const refusalOf = async (conversation: 'sync' | 'lookup' | 'update', name: string) => {
        const cmd = fakeCmd({
            [name]: () => Promise.resolve({ type: `${name}Ack`, message: {} }),
        });
        let reply: RelayMessage | undefined;
        const { wardd } = fakeWardd(async relay => {
            reply = await relay({ name, message: {} });

            return {};
        });
        setWardd(wardd);

        await callWard(cmd as any, 'wardTest', conversation, {});

        return { reply, reachedDevice: cmd.relayCall.mock.calls.length > 0 };
    };

    it('keeps a non-WARD message off the device', async () => {
        const { reply, reachedDevice } = await refusalOf('sync', 'GetPublicKey');

        expect(reachedDevice).toBe(false);
        expect(reply).toEqual({
            name: 'Failure',
            message: {
                code: 'Failure_UnexpectedMessage',
                message: 'wardd may not send GetPublicKey during sync',
            },
        });
    });

    it("keeps another flow's WARD message off the device", async () => {
        const { reply, reachedDevice } = await refusalOf('lookup', 'WARDQueueUpdate');

        expect(reachedDevice).toBe(false);
        expect(reply?.name).toBe('Failure');
    });

    it("lets a write's own messages through", async () => {
        const { reply, reachedDevice } = await refusalOf('update', 'WARDQueueUpdate');

        expect(reachedDevice).toBe(true);
        expect(reply).toEqual({ name: 'WARDQueueUpdateAck', message: {} });
    });

    it('keeps the recovery messages off the device during sync', async () => {
        const { reachedDevice } = await refusalOf('sync', 'WARDPerformRevert');

        expect(reachedDevice).toBe(false);
    });
});

describe('fail-open WARD for signing', () => {
    const signed = { signatures: ['00'] };

    /** wardd whose `sync` conversation is `sync`, answering proofs with `proof`. */
    const syncingWardd = (
        sync: (relay: RelayDevice) => Promise<Record<string, unknown>>,
        proof: () => Promise<Record<string, unknown>> = () => Promise.resolve({ proof: [] }),
    ) => {
        const endpoint: WardRelayEndpoint = {
            call: jest.fn((method, _params, device) =>
                method === 'answerProofRequest' ? proof() : sync(device!),
            ),
            close: jest.fn(),
        };
        setWardd({ connect: () => Promise.resolve(endpoint) });

        return endpoint;
    };

    afterEach(() => {
        jest.useRealTimers();
    });

    it('signs without wardd when none is configured', async () => {
        setWardd(undefined);
        const run = jest.fn(() => Promise.resolve(signed));

        await expect(withSyncedWard({ cmd: fakeCmd({}) as any, run })).resolves.toBe(signed);
        expect(run).toHaveBeenCalledTimes(1);
    });

    it('signs without wardd when it cannot be reached', async () => {
        const cmd = fakeCmd({});
        setWardd({ connect: () => Promise.reject(new Error('wardd is not reachable')) });
        const run = jest.fn(() => Promise.resolve(signed));

        await expect(withSyncedWard({ cmd: cmd as any, run })).resolves.toBe(signed);
        expect(run).toHaveBeenCalledTimes(1);
        expect(cmd.setWardProofCallback).not.toHaveBeenCalled();
    });

    it('signs without wardd, its pulls answered by nobody, when the sync fails', async () => {
        const cmd = fakeCmd({});
        const endpoint = syncingWardd(() =>
            Promise.reject(
                new RelayFailure('internal', 'hydrate: no transition produces root -- lineage'),
            ),
        );
        const run = jest.fn(() => {
            // Cleared before signing: the device's pulls are then answered `unavailable`.
            expect(cmd.setWardProofCallback).toHaveBeenLastCalledWith(undefined);
            expect(endpoint.close).toHaveBeenCalled();

            return Promise.resolve(signed);
        });

        await expect(withSyncedWard({ cmd: cmd as any, run })).resolves.toBe(signed);
        expect(run).toHaveBeenCalledTimes(1);
    });

    it('answers the pulls through wardd while signing after a sync', async () => {
        const cmd = fakeCmd({
            WARDSync: () => Promise.resolve({ type: 'WARDSyncAck', message: { ward_id: 'cd' } }),
        });
        const endpoint = syncingWardd(async relay => {
            await relay({ name: 'WARDSync', message: {} });

            return { wardId: 'cd', counter: 1, root: 'ab' };
        });

        const ack = await withSyncedWard({
            cmd: cmd as any,
            run: () => cmd.pull({ entry_key: 'ee' }),
        });

        expect(ack).toEqual({ proof: [] });
        expect(endpoint.call).toHaveBeenCalledWith('sync', {}, expect.any(Function));
        expect(cmd.setWardProofCallback).toHaveBeenLastCalledWith(undefined);
        expect(endpoint.close).toHaveBeenCalled();
    });

    it('does not sign twice when signing itself fails after a sync', async () => {
        const endpoint = syncingWardd(() => Promise.resolve({}));
        const run = jest.fn(() => Promise.reject(new Error('Failure_ActionCancelled')));

        await expect(withSyncedWard({ cmd: fakeCmd({}) as any, run })).rejects.toThrow(
            'Failure_ActionCancelled',
        );
        expect(run).toHaveBeenCalledTimes(1);
        expect(endpoint.close).toHaveBeenCalled();
    });

    it('gives up on a wardd that accepts the sync and never answers', async () => {
        jest.useFakeTimers();
        const endpoint = syncingWardd(() => new Promise(() => {}));
        const run = jest.fn(() => Promise.resolve(signed));

        const result = withSyncedWard({ cmd: fakeCmd({}) as any, run });
        await jest.advanceTimersByTimeAsync(WARD_SIGNING_SYNC_TIMEOUT - 1);
        expect(run).not.toHaveBeenCalled();
        await jest.advanceTimersByTimeAsync(1);

        await expect(result).resolves.toBe(signed);
        expect(endpoint.close).toHaveBeenCalled();
    });

    it('gives up on a wardd that never finishes connecting, and closes it if it does', async () => {
        jest.useFakeTimers();
        let connected: (endpoint: WardRelayEndpoint) => void = () => {};
        let connectSignal: AbortSignal | undefined;
        setWardd({
            connect: signal =>
                new Promise(resolve => {
                    connectSignal = signal;
                    connected = resolve;
                }),
        });
        const run = jest.fn(() => Promise.resolve(signed));

        const result = withSyncedWard({ cmd: fakeCmd({}) as any, run });
        await jest.advanceTimersByTimeAsync(WARD_SIGNING_SYNC_TIMEOUT);
        await expect(result).resolves.toBe(signed);
        // lets a client that is still connecting close its socket
        expect(connectSignal?.aborted).toBe(true);

        const late: WardRelayEndpoint = { call: jest.fn(), close: jest.fn() };
        connected(late);
        await jest.advanceTimersByTimeAsync(0);

        expect(late.close).toHaveBeenCalled();
        expect(late.call).not.toHaveBeenCalled();
    });

    it("lets wardd's device call in flight end, and no further one start, before signing", async () => {
        jest.useFakeTimers();
        let answerDevice: () => void = () => {};
        const cmd = fakeCmd({
            WARDSync: () =>
                new Promise(resolve => {
                    answerDevice = () => resolve({ type: 'WARDSyncAck', message: {} });
                }),
            WARDReconcile: () => Promise.resolve({ type: 'WARDReconcileAck', message: {} }),
        });
        let next: RelayMessage | undefined;
        syncingWardd(async relay => {
            await relay({ name: 'WARDSync', message: {} });
            next = await relay({ name: 'WARDReconcile', message: {} });

            return {};
        });
        const run = jest.fn(() => Promise.resolve(signed));

        const result = withSyncedWard({ cmd: cmd as any, run });
        await jest.advanceTimersByTimeAsync(WARD_SIGNING_SYNC_TIMEOUT);
        expect(run).not.toHaveBeenCalled();

        answerDevice();
        await expect(result).resolves.toBe(signed);
        await jest.advanceTimersByTimeAsync(0);
        expect(next?.name).toBe('Failure');
        expect(cmd.relayCall).not.toHaveBeenCalledWith('WARDReconcile', expect.anything());
    });

    it('answers a proof pull wardd is too slow for as unavailable', async () => {
        jest.useFakeTimers();
        const cmd = fakeCmd({});
        syncingWardd(
            () => Promise.resolve({}),
            () => new Promise(() => {}),
        );

        const ack = withSyncedWard({ cmd: cmd as any, run: () => cmd.pull({ entry_key: 'ee' }) });
        await jest.advanceTimersByTimeAsync(WARD_SIGNING_PROOF_TIMEOUT);

        await expect(ack).resolves.toEqual({ unavailable: true });
    });
});
