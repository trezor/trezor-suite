// Contract of the experimental "verify account nonce" desktop feature. The verification itself runs
// in a Colibri utility process; the renderer only submits a request and renders the envelope.

export type VerifiedNonceChainId = '1';

export type VerifiedNonceRequest = {
    requestId: string;
    chainId: VerifiedNonceChainId;
    // Checksummed or lowercase 20-byte Ethereum address.
    address: string;
};

// Everything a user needs to check the claim without trusting Suite: the exact proof bytes (and
// their hash) to re-run the verification elsewhere, the beacon facts to look up on a beacon node or
// explorer, the trust anchor the verification started from, and what the run cost.
export type VerifiedNonceEvidence = {
    proofSha256: string;
    proofHex: string;
    proofFormatVersion: string;
    header: {
        parentHash: string;
        stateRoot: string;
    };
    consensus: {
        // Beacon slot carrying the execution block, and the slot whose header the committee signed.
        slot: string;
        signedSlot: string;
        headerProof: 'signature' | 'headerChain' | 'historic';
        syncCommitteeParticipants: number;
        syncCommitteePeriod: string;
    };
    trust: {
        policyId: string;
        policyVersion: number;
        checkpointRoot: string;
        checkpointEpoch: string;
    };
    // Host names only.
    endpoints: {
        prover: string | null;
        beaconApi: string | null;
        checkpointz: string | null;
    };
    transfer: {
        requestCount: number;
        bytesReceived: number;
        durationMs: number;
        isColdStart: boolean;
    };
};

// Quantities travel as unsigned decimal strings so nothing rounds through a JS number.
export type VerifiedNonce = {
    status: 'verified';
    requestId: string;
    chainId: VerifiedNonceChainId;
    address: string;
    nonce: string;
    block: {
        hash: string;
        number: string;
        timestampSeconds: string;
        // "latest" is a request policy: the block is authenticated and recent, not finalized.
        status: 'authenticated-recent';
    };
    verifiedAtMs: number;
    expiresAtMs: number;
    verifier: {
        location: 'desktop';
        runtime: 'native';
        revision: string;
        trustPolicyId: string;
    };
    evidence: VerifiedNonceEvidence;
};

export type NonceFailureCode =
    | 'UNSUPPORTED_CHAIN'
    | 'INVALID_REQUEST'
    | 'TRUST_CONFIG_INVALID'
    | 'NATIVE_UNAVAILABLE'
    | 'PROVIDER_UNAVAILABLE'
    | 'INVALID_PROOF'
    | 'STALE_PROOF'
    | 'CLOCK_INVALID'
    | 'METADATA_UNAVAILABLE'
    | 'LIMIT_EXCEEDED'
    | 'TIMEOUT'
    | 'CANCELLED'
    | 'WORKER_CRASHED'
    | 'VERIFICATION_FAILED';

export type NonceFailure = {
    status: 'failed';
    requestId: string;
    code: NonceFailureCode;
    retryable: boolean;
};

export type VerifiedNonceResult = VerifiedNonce | NonceFailure;

export type NonceVerifierInfo = {
    isAvailable: boolean;
    runtime: 'native' | 'unavailable';
    revision: string;
    trustPolicyId: string | null;
    unavailableCode: Extract<
        NonceFailureCode,
        'NATIVE_UNAVAILABLE' | 'TRUST_CONFIG_INVALID' | 'UNSUPPORTED_CHAIN'
    > | null;
};
