import type { VerifiedNonce, VerifiedNonceEvidence } from '../src/verifiedNonce';

export const mockVerifiedNonceEvidence = (
    overrides: Partial<VerifiedNonceEvidence> = {},
): VerifiedNonceEvidence => ({
    proofSha256: 'fe305bbdd573ea4f14946582faa7bc36af6b79aecf783ea688dafdfdc00c3db1',
    proofHex: '0x0001010010000000',
    proofFormatVersion: '0x00010100',
    header: { parentHash: `0x${'01'.repeat(32)}`, stateRoot: `0x${'02'.repeat(32)}` },
    consensus: {
        slot: '11412916',
        signedSlot: '11412916',
        headerProof: 'signature',
        syncCommitteeParticipants: 512,
        syncCommitteePeriod: '1393',
    },
    trust: {
        policyId: 'p',
        policyVersion: 1,
        checkpointRoot: `0x${'03'.repeat(32)}`,
        checkpointEpoch: '353025',
    },
    endpoints: { prover: 'prover.test', beaconApi: null, checkpointz: null },
    transfer: { requestCount: 1, bytesReceived: 4957, durationMs: 5, isColdStart: false },
    ...overrides,
});

export const mockVerifiedNonce = (overrides: Partial<VerifiedNonce> = {}): VerifiedNonce => ({
    status: 'verified',
    requestId: 'req-1',
    chainId: '1',
    address: '0xd2674da94285660c9b2353131bef2d8211369a4b',
    nonce: '309747',
    block: {
        hash: `0x${'ab'.repeat(32)}`,
        number: '22196327',
        timestampSeconds: '1743779015',
        status: 'authenticated-recent',
    },
    verifiedAtMs: 1743779020000,
    expiresAtMs: 1743779075000,
    verifier: { location: 'desktop', runtime: 'native', revision: '3.0.0', trustPolicyId: 'p' },
    evidence: mockVerifiedNonceEvidence(),
    ...overrides,
});
