import type { C4Runtime, RuntimeStatus } from '@corpus-core/colibri-stateless';

import type { NonceFailureCode } from '@suite/desktop-app-api';

import { type AuthenticatedHeader, extractAuthenticatedHeader } from './authenticatedHeader';
import { mapVerifierError } from './errors';
import { type ConsensusEvidence, extractConsensusEvidence } from './proofEvidence';
import { parseHexQuantity } from './quantity';
import { type RequestPhase, type RequestRouter, isAbortReason } from './requestRouter';

export const NONCE_RPC_METHOD = 'eth_getTransactionCount';
export const CHAIN_ID = 1n;

const MAX_PENDING_ROUNDS = 64;

export type Failure = { code: NonceFailureCode; detail: string };

export type StepResult<T> = { success: true; value: T } | { success: false; failure: Failure };

export const fail = <T>(code: NonceFailureCode, detail: string): StepResult<T> => ({
    success: false,
    failure: { code, detail },
});

export const nonceRequestArgs = (address: string) =>
    JSON.stringify([address.toLowerCase(), 'latest']);

// Runs one C4 context to completion, feeding every pending data request through the router.
export const driveRuntime = async (
    runtime: C4Runtime,
    step: () => RuntimeStatus,
    router: RequestRouter,
    phase: RequestPhase,
    signal: AbortSignal,
): Promise<StepResult<unknown>> => {
    for (let round = 0; round < MAX_PENDING_ROUNDS; round++) {
        if (isAbortReason(signal.reason)) return fail(signal.reason.code, 'aborted');
        const state = step();
        switch (state.status) {
            case 'success':
                return { success: true, value: state.result };
            case 'pending':
                await Promise.all(
                    (state.requests ?? []).map(request => router.handle(runtime, request, phase)),
                );
                break;
            case 'revert':
                return fail('VERIFICATION_FAILED', 'unexpected revert status');
            case 'error': {
                const routerFailure = router.getFailure();
                if (routerFailure) return fail(routerFailure, state.error ?? '');
                if (phase === 'acquire') return fail('PROVIDER_UNAVAILABLE', state.error ?? '');

                return fail(mapVerifierError(state.error ?? ''), state.error ?? '');
            }
            default:
                return fail('VERIFICATION_FAILED', 'unknown runtime status');
        }
    }

    return fail('VERIFICATION_FAILED', 'runtime did not converge');
};

export type VerifiedProofFacts = {
    nonce: bigint;
    header: AuthenticatedHeader;
    consensus: ConsensusEvidence;
};

export type VerifyProofBytesParams = {
    runtime: C4Runtime;
    proof: Uint8Array;
    address: string;
    checkpointRoot: string;
    router: RequestRouter;
    // Lower bound for the block timestamp of a "latest" proof; 0n disables the check (re-verifying
    // an exported record long after the fact).
    minLatestBlockTs: bigint;
    signal: AbortSignal;
};

/**
 * Verifies proof bytes for `eth_getTransactionCount(address, "latest")` under the trusted
 * checkpoint and reads the nonce plus the header and consensus facts out of those same bytes.
 * Used by the live verifier and by the offline re-verification of an exported record.
 */
export const verifyProofBytes = async ({
    runtime,
    proof,
    address,
    checkpointRoot,
    router,
    minLatestBlockTs,
    signal,
}: VerifyProofBytesParams): Promise<StepResult<VerifiedProofFacts>> => {
    let nonce: bigint;
    const context = runtime.createVerifyCtx(
        proof,
        NONCE_RPC_METHOD,
        nonceRequestArgs(address),
        CHAIN_ID,
        checkpointRoot,
        null,
        0,
        minLatestBlockTs,
    );
    try {
        const result = await driveRuntime(
            runtime,
            () => runtime.verifyProof(context),
            router,
            'verify',
            signal,
        );
        if (!result.success) return result;
        const parsed = parseHexQuantity(result.value);
        if (!parsed.success) return fail('VERIFICATION_FAILED', parsed.error);
        nonce = parsed.value;
    } finally {
        runtime.freeVerifyCtx(context);
    }

    // Both parses read the exact bytes that just verified; see extractAuthenticatedHeader.
    const decoded = runtime.decodeProof(proof);
    const header = extractAuthenticatedHeader(decoded, address);
    if (!header.success) return fail(header.code, header.detail);
    const consensus = extractConsensusEvidence(decoded);
    if (!consensus.success) return fail('METADATA_UNAVAILABLE', consensus.detail);

    return {
        success: true,
        value: { nonce, header: header.header, consensus: consensus.consensus },
    };
};
