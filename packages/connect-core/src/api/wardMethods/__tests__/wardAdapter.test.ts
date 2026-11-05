import { ERRORS } from '@trezor/connect-common/src/constants';
import {
    type RelayDevice,
    RelayFailure,
    type RelayMessage,
    type WardRelay,
    type WardRelayEndpoint,
} from '@trezor/ward';

import * as settingsStore from '../../../data/settingsStore';
import { callWard, withWard } from '../wardAdapter';

/** A device session: `relayCall` answers by name; a pull goes through the registered callback. */
const fakeCmd = (answers: Record<string, () => Promise<{ type: string; message: any }>>) => {
    let proofCallback: ((request: any) => any) | undefined;
    const cmd = {
        relayCall: jest.fn((name: string, _msg: Record<string, unknown>) => answers[name]!()),
        setWardProofCallback: jest.fn(cb => {
            proofCallback = cb;
        }),
        typedCall: jest.fn(),
        pull: (request: Record<string, unknown>) => proofCallback!(request),
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
