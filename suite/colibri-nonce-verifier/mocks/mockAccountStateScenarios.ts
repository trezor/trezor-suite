import { getRuntime } from '@corpus-core/colibri-stateless';
import assert from 'node:assert/strict';

import {
    type MockFetchCall,
    createMockAccountStateWarmStorage,
    createMockClock,
    createMockFixtureFetch,
    createMockLogger,
    installMockLocalStorage,
    mockAccountStateFixture,
    mockTrustManifest,
    readMockFixture,
} from './mockColibriFixtures';
import type { VerifierScenario } from './mockVerifierScenarios';
import type { VerifiedAccountStateResult } from '../src/accountState';
import type { ColibriRuntimeKind } from '../src/colibriRuntime';
import { type NonceVerifier, createNonceVerifier } from '../src/createNonceVerifier';
import { createSafeImplementationResolver } from '../src/createSafeImplementationResolver';
import { hexToBytes } from '../src/quantity';
import type { VerifiedAccountStateRequest } from '../src/request';

// The same fixture-driven style as mockVerifierScenarios, for the `eth_getProof` read the Safe
// implementation resolution is built on.

installMockLocalStorage();

const accountStateProof = readMockFixture(mockAccountStateFixture.directory, 'proof.ssz');

const request: VerifiedAccountStateRequest = {
    requestId: 'state-1',
    chainId: '1',
    address: mockAccountStateFixture.address,
    storageKeys: [...mockAccountStateFixture.storageKeys],
};

type SetupParams = {
    runtimeKinds: readonly ColibriRuntimeKind[];
    proof?: Uint8Array;
    clockStartMs?: number;
};

const setup = ({
    runtimeKinds,
    proof = accountStateProof,
    clockStartMs = (mockAccountStateFixture.block.timestampSeconds + 5) * 1000,
}: SetupParams) => {
    const calls: MockFetchCall[] = [];
    const logger = createMockLogger();
    const verifier: NonceVerifier = createNonceVerifier(
        {
            clock: createMockClock(clockStartMs),
            logger,
            getColibriRuntime: getRuntime,
            fetch: createMockFixtureFetch({
                proof,
                calls,
                beaconDirectory: mockAccountStateFixture.directory,
            }),
        },
        {
            trustManifest: mockTrustManifest({
                checkpoint: {
                    ...mockAccountStateFixture.checkpoint,
                    sources: ['fixture'],
                    obtainedAt: '2025-04-07T00:00:00Z',
                },
            }),
            storage: createMockAccountStateWarmStorage(),
            allowedRuntimeKinds: runtimeKinds,
        },
    );

    return { verifier, calls, logger };
};

const assertFailure = (result: { status: string }, code: string) => {
    assert.equal(result.status, 'failed');
    assert.equal('code' in result ? result.code : undefined, code);
};

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

const assertVerified = (
    result: VerifiedAccountStateResult,
): Extract<VerifiedAccountStateResult, { status: 'verified' }> => {
    assert.equal(result.status, 'verified');
    if (result.status !== 'verified') throw new Error('unreachable');

    return result;
};

export const mockAccountStateScenarios: VerifierScenario[] = [
    {
        name: 'proves the code hash and storage words of an account in one proof',
        run: async runtimeKinds => {
            const { verifier, calls, logger } = setup({ runtimeKinds });

            const result = assertVerified(await verifier.verifyAccountState(request));

            assert.equal(result.requestId, 'state-1');
            assert.equal(result.address, mockAccountStateFixture.address.toLowerCase());
            assert.equal(result.codeHash, mockAccountStateFixture.codeHash);
            assert.deepEqual(result.storage, mockAccountStateFixture.storage);
            assert.deepEqual(result.block, {
                hash: mockAccountStateFixture.block.hash,
                number: mockAccountStateFixture.block.number,
                timestampSeconds: String(mockAccountStateFixture.block.timestampSeconds),
                status: 'authenticated-recent',
            });
            assert.equal(
                result.expiresAtMs,
                (mockAccountStateFixture.block.timestampSeconds + 60) * 1000,
            );
            assert.equal(result.evidence.proofSha256, mockAccountStateFixture.proofSha256);
            assert.deepEqual(result.evidence.header, {
                parentHash: mockAccountStateFixture.block.parentHash,
                stateRoot: mockAccountStateFixture.block.stateRoot,
            });
            assert.equal(result.evidence.consensus.slot, '11434568');
            assert.equal(result.evidence.consensus.syncCommitteeParticipants, 508);
            assert.equal(
                result.evidence.trust.checkpointRoot,
                mockAccountStateFixture.checkpoint.root,
            );

            // Exactly one prover round-trip asking for the account and the requested slots.
            assert.equal(calls.length, 1);
            const body = JSON.parse(calls[0]?.body ?? 'null');
            assert.equal(body.method, 'eth_getProof');
            assert.deepEqual(body.params, [
                mockAccountStateFixture.address.toLowerCase(),
                mockAccountStateFixture.storageKeys,
                'latest',
            ]);
            assert.doesNotMatch(logger.messages.join('\n'), /b685760ebd36/i);
        },
    },
    {
        name: 'rejects a proof with a tampered storage value',
        run: async runtimeKinds => {
            const decoded = (await getRuntime()).decodeProof(accountStateProof);
            const storageLeaf: string = decoded.proof.storageProof[0].proof.at(-1);
            const { verifier } = setup({
                runtimeKinds,
                proof: tamper(accountStateProof, storageLeaf, storageLeaf.length / 2 - 3),
            });

            assertFailure(await verifier.verifyAccountState(request), 'VERIFICATION_FAILED');
        },
    },
    {
        name: 'rejects a proof with a tampered account leaf',
        run: async runtimeKinds => {
            const decoded = (await getRuntime()).decodeProof(accountStateProof);
            const { verifier } = setup({
                runtimeKinds,
                proof: tamper(accountStateProof, decoded.proof.accountProof.at(-1), 40),
            });

            assertFailure(await verifier.verifyAccountState(request), 'VERIFICATION_FAILED');
        },
    },
    {
        // Colibri 3.0.0 verifies this proof and returns both storage words: it does not bind the
        // proven keys to the requested ones. The result parser is what refuses it.
        name: 'rejects a proof that answers other storage keys than requested',
        run: async runtimeKinds => {
            const { verifier } = setup({ runtimeKinds });

            assertFailure(
                await verifier.verifyAccountState({
                    ...request,
                    storageKeys: [mockAccountStateFixture.storageKeys[0]],
                }),
                'VERIFICATION_FAILED',
            );
        },
    },
    {
        name: 'rejects an account state proof for another address',
        run: async runtimeKinds => {
            const { verifier } = setup({ runtimeKinds });

            assertFailure(
                await verifier.verifyAccountState({
                    ...request,
                    address: '0xd2674dA94285660c9b2353131bef2d8211369A4B',
                }),
                'VERIFICATION_FAILED',
            );
        },
    },
    {
        name: 'applies the same freshness window as the nonce',
        run: async runtimeKinds => {
            const { verifier } = setup({
                runtimeKinds,
                clockStartMs: (mockAccountStateFixture.block.timestampSeconds + 120) * 1000,
            });

            assertFailure(await verifier.verifyAccountState(request), 'STALE_PROOF');
        },
    },
    {
        name: 'validates storage keys before touching the network',
        run: async runtimeKinds => {
            const { verifier, calls } = setup({ runtimeKinds });
            const slot = mockAccountStateFixture.storageKeys[0];

            for (const storageKeys of [
                ['0x0'],
                // Keys are compared with the verified result as strings, so only lowercase passes.
                [`0x${'A'.repeat(64)}`],
                [slot, slot],
                Array.from({ length: 5 }, (_, index) => `0x${String(index).padStart(64, '0')}`),
            ]) {
                assertFailure(
                    await verifier.verifyAccountState({ ...request, storageKeys }),
                    'INVALID_REQUEST',
                );
            }
            assert.equal(calls.length, 0);
        },
    },
    {
        name: 'never resolves a Safe implementation from a proof that does not cover slot 0',
        run: async runtimeKinds => {
            const { verifier } = setup({ runtimeKinds });
            const resolveSafeImplementation = createSafeImplementationResolver(verifier);

            const result = await resolveSafeImplementation({
                requestId: 'safe-1',
                chainId: '1',
                address: mockAccountStateFixture.address,
            });

            assertFailure(result, 'VERIFICATION_FAILED');
        },
    },
];
