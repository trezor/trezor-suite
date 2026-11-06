import { parseConnectSettings } from '@trezor/connect-common/src/data/connectSettings';
import { RelayFailure } from '@trezor/ward';

import { type RustWardAdapter, RustWardRelay } from './rustWardRelay';
import { callWard } from './wardAdapter';
import * as settingsStore from '../../data/settingsStore';
import type { DeviceCommands } from '../../device/DeviceCommands';

describe('Rust WARD adapter in Connect', () => {
    afterEach(() => settingsStore.set(parseConnectSettings({})));

    it('uses the current Connect session for device calls and nested proof requests', async () => {
        let proofCallback: ((request: Record<string, unknown>) => Promise<unknown>) | undefined;
        let closed = false;
        const proofRequest = { entry_key: 'aa', absent: null };
        const adapter: RustWardAdapter = {
            call: async (_method, _params, device) => {
                expect(await device!({ name: 'WARDSync', message: { unset: null } })).toEqual({
                    name: 'WARDSyncAck',
                    message: { nonce: 'ff' },
                });

                return { counter: 1 };
            },
            answerWardRequest: (name, request) => {
                expect(name).toBe('WARDProofRequest');
                expect(request).toEqual({ entry_key: 'aa' });

                return Promise.resolve({
                    name: 'WARDProofAck',
                    message: { proof: [], content: null },
                });
            },
            close: async () => {
                await Promise.resolve();
                closed = true;
            },
        };
        const cmd = {
            relayCall: async (name: string, message: Record<string, unknown>) => {
                expect(name).toBe('WARDSync');
                expect(message).toEqual({});
                expect(await proofCallback!(proofRequest)).toEqual({ proof: [] });

                return { type: 'WARDSyncAck', message: { nonce: 'ff', absent: null } };
            },
            setWardProofCallback: (callback: typeof proofCallback) => {
                proofCallback = callback;
            },
            setWardNodeCallback: () => {},
        };
        settingsStore.set(
            parseConnectSettings({
                wardd: new RustWardRelay({ connect: () => Promise.resolve(adapter) }),
            }),
        );

        expect(
            await callWard(
                cmd as unknown as ReturnType<typeof DeviceCommands>,
                'wardInit',
                'sync',
                {},
            ),
        ).toEqual({ counter: 1 });
        expect(proofCallback).toBeUndefined();
        expect(closed).toBe(true);
    });

    it("routes a listing walk's node pull to the native adapter", async () => {
        const adapter: RustWardAdapter = {
            call: () => Promise.reject(new Error('no conversation expected')),
            answerWardRequest: (name, request) => {
                expect(name).toBe('WARDNodeRequest');
                expect(request).toEqual({ node_hash: 'ab' });

                return Promise.resolve({ name: 'WARDNodeAck', message: { nodes: [] } });
            },
            close: () => Promise.resolve(),
        };
        const endpoint = await new RustWardRelay({
            connect: () => Promise.resolve(adapter),
        }).connect();

        await expect(
            endpoint.call('answerNodeRequest', { request: { node_hash: 'ab' } }),
        ).resolves.toEqual({ nodes: [] });
        await endpoint.close();
    });

    it('converts structured native errors into Connect relay failures', async () => {
        const adapter: RustWardAdapter = {
            call: () =>
                Promise.reject(Object.assign(new Error('sync first'), { code: 'no_store' })),
            answerWardRequest: () => Promise.reject(new Error('unexpected proof request')),
            close: () => Promise.resolve(),
        };
        const endpoint = await new RustWardRelay({
            connect: () => Promise.resolve(adapter),
        }).connect();

        await expect(endpoint.call('status')).rejects.toEqual(
            new RelayFailure('no_store', 'sync first'),
        );
        await endpoint.close();
    });

    it('rejects malformed proof requests before invoking the adapter', async () => {
        const adapter: RustWardAdapter = {
            call: () => Promise.reject(new Error('unexpected call')),
            answerWardRequest: () => Promise.reject(new Error('unexpected proof request')),
            close: () => Promise.resolve(),
        };
        const endpoint = await new RustWardRelay({
            connect: () => Promise.resolve(adapter),
        }).connect();

        await expect(endpoint.call('answerProofRequest', {})).rejects.toMatchObject({
            code: 'bad_request',
        });
        await expect(endpoint.call('hello')).rejects.toMatchObject({ code: 'bad_request' });
        await endpoint.close();
    });
});
