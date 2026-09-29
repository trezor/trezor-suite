import { getRuntime } from '@corpus-core/colibri-stateless';
import assert from 'node:assert/strict';

import type { VerifiedNonceRequest } from '@suite/desktop-app-api';

import {
    type MockClock,
    type MockFetchCall,
    createMockClock,
    createMockFixtureFetch,
    createMockLogger,
    createMockWarmStorage,
    installMockLocalStorage,
    mockBalanceFixture,
    mockNonceFixture,
    mockTrustManifest,
    readMockFixture,
    toResponseBody,
} from './mockColibriFixtures';
import type { ColibriRuntimeKind } from '../src/colibriRuntime';
import { type NonceVerifier, createNonceVerifier } from '../src/createNonceVerifier';
import { hexToBytes } from '../src/quantity';
import { DEFAULT_REQUEST_LIMITS, type RequestRouterLimits } from '../src/requestRouter';
import { type ColibriStorage, createMemoryStorage } from '../src/storage';

// Fixture-driven acceptance scenarios for the real verifier over the real proof bytes. They are
// plain functions with node:assert so the jest suite (native addon) and the WASM smoke runner
// execute exactly the same checks.
export type VerifierScenario = {
    name: string;
    run: (runtimeKinds: readonly ColibriRuntimeKind[]) => Promise<void>;
};

installMockLocalStorage();

const nonceProof = readMockFixture(mockNonceFixture.directory, 'proof.ssz');
const balanceProof = readMockFixture(mockBalanceFixture.directory, 'proof.ssz');

const request: VerifiedNonceRequest = {
    requestId: 'req-1',
    chainId: '1',
    address: mockNonceFixture.address,
};

type SetupParams = {
    runtimeKinds: readonly ColibriRuntimeKind[];
    proof?: Uint8Array | null;
    storage?: ColibriStorage;
    clock?: MockClock;
    manifest?: Record<string, unknown>;
    proverResponse?: () => Response;
    limits?: RequestRouterLimits;
};

const setup = ({
    runtimeKinds,
    proof = nonceProof,
    storage = createMockWarmStorage(),
    clock = createMockClock(),
    manifest = mockTrustManifest(),
    proverResponse,
    limits,
}: SetupParams) => {
    const calls: MockFetchCall[] = [];
    const logger = createMockLogger();
    const verifier: NonceVerifier = createNonceVerifier(
        {
            clock,
            logger,
            getColibriRuntime: getRuntime,
            fetch: createMockFixtureFetch({
                proof,
                proverResponse,
                calls,
                beaconDirectory: mockNonceFixture.directory,
            }),
        },
        { trustManifest: manifest, storage, allowedRuntimeKinds: runtimeKinds, limits },
    );

    return { verifier, calls, logger, storage, clock };
};

const proverCalls = (calls: MockFetchCall[]) =>
    calls.filter(call => new URL(call.url).hostname === 'prover.test');
const consensusCalls = (calls: MockFetchCall[]) =>
    calls.filter(call => new URL(call.url).hostname !== 'prover.test');

const decodeNonceProof = async () => (await getRuntime()).decodeProof(nonceProof);

// Flips one byte inside the first occurrence of `hexField` in the proof.
const tamper = (proof: Uint8Array, hexField: string, byteOffset: number): Uint8Array => {
    const needle = hexToBytes(hexField);
    assert.ok(needle, 'tamper needle is not hex');
    const index = Buffer.from(proof).indexOf(Buffer.from(needle));
    assert.ok(index >= 0, 'tamper needle not found in proof');
    const copy = new Uint8Array(proof);
    copy[index + byteOffset]! ^= 0x01;

    return copy;
};

const readUint32 = (bytes: Uint8Array, offset: number) =>
    (bytes[offset]! |
        (bytes[offset + 1]! << 8) |
        (bytes[offset + 2]! << 16) |
        (bytes[offset + 3]! << 24)) >>>
    0;

const writeUint32 = (bytes: Uint8Array, offset: number, value: number) => {
    bytes[offset] = value & 0xff;
    bytes[offset + 1] = (value >>> 8) & 0xff;
    bytes[offset + 2] = (value >>> 16) & 0xff;
    bytes[offset + 3] = (value >>> 24) & 0xff;
};

// C4Request = [version][data offset][proof offset][sync_data offset]...; the proof union is a
// selector byte followed by the AccountProof container, whose last field (elProof) starts at the
// offset stored at container+28. Swapping that tail in from another proof keeps everything else.
const spliceElProof = (target: Uint8Array, source: Uint8Array): Uint8Array => {
    const targetContainer = readUint32(target, 8) + 1;
    const targetSyncOffset = readUint32(target, 12);
    const targetElProofStart = targetContainer + readUint32(target, targetContainer + 28);
    const sourceContainer = readUint32(source, 8) + 1;
    const sourceSyncOffset = readUint32(source, 12);
    const sourceElProofStart = sourceContainer + readUint32(source, sourceContainer + 28);

    const head = target.subarray(0, targetElProofStart);
    const elProof = source.subarray(sourceElProofStart, sourceSyncOffset);
    const tail = target.subarray(targetSyncOffset);
    const spliced = new Uint8Array(head.length + elProof.length + tail.length);
    spliced.set(head, 0);
    spliced.set(elProof, head.length);
    spliced.set(tail, head.length + elProof.length);
    writeUint32(spliced, 12, head.length + elProof.length);

    return spliced;
};

const assertFailure = (result: unknown, code: string) => {
    assert.ok(typeof result === 'object' && result !== null, 'result is not an object');
    assert.equal((result as { status: string }).status, 'failed');
    assert.equal((result as { code: string }).code, code);
};

type TamperTarget = { name: string; locate: (decoded: any) => [string, number] };

const TAMPER_TARGETS: TamperTarget[] = [
    {
        name: 'account leaf (nonce field)',
        locate: decoded => [decoded.proof.accountProof.at(-1), 8],
    },
    { name: 'execution header', locate: decoded => [decoded.proof.elProof.elHeader, 500] },
    { name: 'proven address', locate: decoded => [decoded.proof.address, 3] },
];

const tamperScenario = (target: TamperTarget): VerifierScenario => ({
    name: `rejects a proof with a tampered ${target.name}`,
    run: async runtimeKinds => {
        const [field, offset] = target.locate(await decodeNonceProof());
        const { verifier, calls } = setup({
            runtimeKinds,
            proof: tamper(nonceProof, field, offset),
        });

        assertFailure(await verifier.verify(request), 'VERIFICATION_FAILED');
        assert.ok(calls.every(call => !call.url.includes('unverified')));
    },
});

export const mockVerifierScenarios: VerifierScenario[] = [
    // Runs first on purpose: Colibri memoizes signing roots it has already validated in this
    // process (BLOCK_HASH_CACHE), so once the genuine proof has verified, the same header with a
    // damaged signature is accepted on the strength of the earlier check. The header is authentic
    // either way, but the signature can only be exercised before it is cached.
    tamperScenario({
        name: 'sync committee signature',
        locate: decoded => [decoded.proof.elProof.clHeaderProof.sync_committee_signature, 10],
    }),
    {
        name: 'produces a verified envelope bound to the authenticated header',
        run: async runtimeKinds => {
            const { verifier, calls, logger } = setup({ runtimeKinds });

            const result = await verifier.verify(request);

            assert.equal(result.status, 'verified');
            if (result.status !== 'verified') return;
            const { evidence, ...envelope } = result;
            assert.deepEqual(envelope, {
                status: 'verified',
                requestId: 'req-1',
                chainId: '1',
                address: mockNonceFixture.address.toLowerCase(),
                nonce: mockNonceFixture.nonce,
                block: {
                    hash: mockNonceFixture.block.hash,
                    number: mockNonceFixture.block.number,
                    timestampSeconds: String(mockNonceFixture.block.timestampSeconds),
                    status: 'authenticated-recent',
                },
                verifiedAtMs: (mockNonceFixture.block.timestampSeconds + 5) * 1000,
                expiresAtMs: (mockNonceFixture.block.timestampSeconds + 60) * 1000,
                verifier: {
                    location: 'desktop',
                    runtime: 'native',
                    revision: '3.0.0',
                    trustPolicyId: 'test-policy',
                },
            });
            // Every fact a user could check elsewhere comes from the verified bytes themselves.
            const { durationMs, ...transfer } = evidence.transfer;
            assert.ok(Number.isInteger(durationMs) && durationMs >= 0);
            assert.deepEqual(
                { ...evidence, transfer },
                {
                    proofSha256: mockNonceFixture.proofSha256,
                    proofHex: `0x${Buffer.from(nonceProof).toString('hex')}`,
                    proofFormatVersion: '0x00010100',
                    header: {
                        parentHash: mockNonceFixture.block.parentHash,
                        stateRoot: mockNonceFixture.block.stateRoot,
                    },
                    consensus: {
                        slot: '11412916',
                        signedSlot: '11412916',
                        headerProof: 'signature',
                        syncCommitteeParticipants: 512,
                        syncCommitteePeriod: '1393',
                    },
                    trust: {
                        policyId: 'test-policy',
                        policyVersion: 1,
                        checkpointRoot: mockNonceFixture.checkpoint.root,
                        checkpointEpoch: String(mockNonceFixture.checkpoint.epoch),
                    },
                    endpoints: { prover: 'prover.test', beaconApi: null, checkpointz: null },
                    transfer: {
                        requestCount: 1,
                        bytesReceived: nonceProof.length,
                        isColdStart: false,
                    },
                },
            );
            assert.equal(proverCalls(calls).length, 1);
            assert.equal(consensusCalls(calls).length, 0);
            // Only the fixed method, the normalized address and "latest" leave the machine, and
            // no cached header is advertised, so the prover must return a full header proof.
            const body = JSON.parse(proverCalls(calls)[0]?.body ?? 'null');
            assert.equal(body.method, 'eth_getTransactionCount');
            assert.deepEqual(body.params, [mockNonceFixture.address.toLowerCase(), 'latest']);
            assert.equal('last_block_hash' in body, false);
            assert.doesNotMatch(logger.messages.join('\n'), /d2674da94285/i);
        },
    },
    {
        name: 'bootstraps a cold verifier from the trusted checkpoint over consensus endpoints only',
        run: async runtimeKinds => {
            const storage = createMemoryStorage();
            const { verifier, calls } = setup({ runtimeKinds, storage });

            const result = await verifier.verify(request);

            assert.equal(result.status, 'verified');
            if (result.status !== 'verified') return;
            assert.notEqual(storage.get('states_1'), null);
            assert.equal(result.evidence.endpoints.beaconApi, 'beacon.test');
            assert.equal(result.evidence.transfer.isColdStart, true);
            assert.ok(result.evidence.transfer.requestCount > 1);
            const urls = consensusCalls(calls).map(call => call.url);
            assert.ok(urls.some(url => url.includes('/eth/v1/beacon/light_client/bootstrap/')));
            assert.ok(urls.some(url => url.includes('/eth/v1/beacon/light_client/updates')));
            assert.ok(urls.every(url => !url.includes('unverified_rpc')));
        },
    },
    {
        name: 'rejects a proof whose authenticated block left the freshness window',
        run: async runtimeKinds => {
            const clock = createMockClock((mockNonceFixture.block.timestampSeconds + 120) * 1000);
            const { verifier } = setup({ runtimeKinds, clock });

            assert.deepEqual(await verifier.verify(request), {
                status: 'failed',
                requestId: 'req-1',
                code: 'STALE_PROOF',
                retryable: true,
            });
        },
    },
    {
        name: 'rejects a block timestamp beyond the allowed future skew',
        run: async runtimeKinds => {
            const clock = createMockClock((mockNonceFixture.block.timestampSeconds - 30) * 1000);
            const { verifier } = setup({ runtimeKinds, clock });

            assertFailure(await verifier.verify(request), 'CLOCK_INVALID');
        },
    },
    {
        name: 'rejects a proof for another address',
        run: async runtimeKinds => {
            const { verifier } = setup({ runtimeKinds });

            assertFailure(
                await verifier.verify({ ...request, address: mockBalanceFixture.address }),
                'VERIFICATION_FAILED',
            );
        },
    },
    ...TAMPER_TARGETS.map(tamperScenario),
    {
        name: 'rejects an account proof spliced under a header from another block',
        run: async runtimeKinds => {
            const spliced = spliceElProof(nonceProof, balanceProof);
            const decoded = (await getRuntime()).decodeProof(spliced);
            assert.equal(decoded.proof.elProof.clHeader.slot, '0xae254b');
            const { verifier } = setup({ runtimeKinds, proof: spliced });

            assertFailure(await verifier.verify(request), 'VERIFICATION_FAILED');
        },
    },
    {
        name: 'fails when the prover answers with plain JSON-RPC instead of proof bytes',
        run: async runtimeKinds => {
            const { verifier, calls } = setup({
                runtimeKinds,
                proverResponse: () =>
                    new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: '0x4b9f3' }), {
                        status: 200,
                        headers: { 'content-type': 'application/json' },
                    }),
            });

            const result = await verifier.verify(request);

            assert.equal(result.status, 'failed');
            assert.equal(consensusCalls(calls).length, 0);
        },
    },
    {
        name: 'fails closed when the prover is down and never falls back to execution RPC',
        run: async runtimeKinds => {
            const { verifier, calls } = setup({ runtimeKinds, proof: null });

            assert.deepEqual(await verifier.verify(request), {
                status: 'failed',
                requestId: 'req-1',
                code: 'PROVIDER_UNAVAILABLE',
                retryable: true,
            });
            assert.equal(proverCalls(calls).length, 1);
            assert.equal(consensusCalls(calls).length, 0);
        },
    },
    {
        name: 'rejects an oversized prover response',
        run: async runtimeKinds => {
            const { verifier } = setup({
                runtimeKinds,
                limits: { ...DEFAULT_REQUEST_LIMITS, maxResponseBytes: 1024 },
            });

            assertFailure(await verifier.verify(request), 'LIMIT_EXCEEDED');
        },
    },
    {
        name: 'refuses to run without a populated, unexpired trust manifest',
        run: async runtimeKinds => {
            const { verifier, calls } = setup({
                runtimeKinds,
                manifest: mockTrustManifest({ checkpoint: null }),
            });

            assertFailure(await verifier.verify(request), 'TRUST_CONFIG_INVALID');
            assert.equal(calls.length, 0);
            const info = await verifier.getInfo();
            assert.equal(info.isAvailable, false);
            assert.equal(info.unavailableCode, 'TRUST_CONFIG_INVALID');
        },
    },
    {
        name: 'reports an implausible host clock before touching the network',
        run: async runtimeKinds => {
            const { verifier, calls } = setup({
                runtimeKinds,
                clock: createMockClock((mockNonceFixture.checkpoint.timestampSeconds - 1) * 1000),
            });

            assertFailure(await verifier.verify(request), 'CLOCK_INVALID');
            assert.equal(calls.length, 0);
        },
    },
    {
        name: 'validates the request before doing anything else',
        run: async runtimeKinds => {
            const { verifier, calls } = setup({ runtimeKinds });

            assertFailure(
                await verifier.verify({ ...request, address: '0x1234' }),
                'INVALID_REQUEST',
            );
            assertFailure(
                await verifier.verify({ ...request, chainId: '5' as '1' }),
                'UNSUPPORTED_CHAIN',
            );
            assert.equal(calls.length, 0);
        },
    },
    {
        name: 'cancels a running job through the abort signal',
        run: async runtimeKinds => {
            const controller = new AbortController();
            const { verifier } = setup({
                runtimeKinds,
                proverResponse: () => {
                    controller.abort();

                    return new Response(toResponseBody(nonceProof), { status: 200 });
                },
            });

            assert.deepEqual(await verifier.verify(request, controller.signal), {
                status: 'failed',
                requestId: 'req-1',
                code: 'CANCELLED',
                retryable: false,
            });
        },
    },
    {
        name: 'serializes concurrent jobs on the single runtime',
        run: async runtimeKinds => {
            const { verifier, calls } = setup({ runtimeKinds });

            const results = await Promise.all([
                verifier.verify(request),
                verifier.verify({ ...request, requestId: 'req-2' }),
            ]);

            assert.deepEqual(
                results.map(result => result.status),
                ['verified', 'verified'],
            );
            assert.equal(results[1]?.requestId, 'req-2');
            assert.equal(proverCalls(calls).length, 2);
        },
    },
    {
        name: 'reports availability once the runtime and manifest are usable',
        run: async runtimeKinds => {
            const { verifier } = setup({ runtimeKinds });

            assert.deepEqual(await verifier.getInfo(), {
                isAvailable: true,
                runtime: runtimeKinds.includes('native') ? 'native' : 'unavailable',
                revision: '3.0.0',
                trustPolicyId: 'test-policy',
                unavailableCode: null,
            });
        },
    },
];
