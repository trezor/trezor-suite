import type { VerifiedAccountState } from '../src/accountState';

export const mockVerifiedAccountState = (
    overrides: Partial<VerifiedAccountState> = {},
): VerifiedAccountState => ({
    status: 'verified',
    requestId: 'req-1',
    chainId: '1',
    address: '0x1111111111111111111111111111111111111111',
    codeHash: `0x${'00'.repeat(32)}`,
    storage: [],
    block: {
        hash: `0x${'aa'.repeat(32)}`,
        number: '22217844',
        timestampSeconds: '1744038839',
        status: 'authenticated-recent',
    },
    verifiedAtMs: 1_744_038_844_000,
    expiresAtMs: 1_744_038_899_000,
    verifier: {
        location: 'desktop',
        runtime: 'native',
        revision: '3.0.0',
        trustPolicyId: 'test-policy',
    },
    evidence: {
        proofSha256: 'ff'.repeat(32),
        proofHex: '0x00',
        proofFormatVersion: '0x00010100',
        header: { parentHash: `0x${'bb'.repeat(32)}`, stateRoot: `0x${'cc'.repeat(32)}` },
        consensus: {
            slot: '11434568',
            signedSlot: '11434568',
            headerProof: 'signature',
            syncCommitteeParticipants: 508,
            syncCommitteePeriod: '1395',
        },
        trust: {
            policyId: 'test-policy',
            policyVersion: 1,
            checkpointRoot: `0x${'dd'.repeat(32)}`,
            checkpointEpoch: '356865',
        },
        endpoints: { prover: 'prover.test', beaconApi: null, checkpointz: null },
        transfer: { requestCount: 1, bytesReceived: 1, durationMs: 1, isColdStart: false },
    },
    ...overrides,
});
