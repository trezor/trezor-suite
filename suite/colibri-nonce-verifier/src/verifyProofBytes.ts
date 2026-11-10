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

// One proofable read: the RPC method and arguments sent to the prover and verified by Colibri, the
// account the proof must be bound to, and how to read the verified JSON result.
export type ProvenRead<T> = {
    method: string;
    argsJson: string;
    address: string;
    parseResult: (result: unknown) => StepResult<T>;
};

export type VerifiedReadFacts<T> = {
    value: T;
    header: AuthenticatedHeader;
    consensus: ConsensusEvidence;
};

export type VerifyProvenReadParams<T> = {
    runtime: C4Runtime;
    proof: Uint8Array;
    read: ProvenRead<T>;
    checkpointRoot: string;
    router: RequestRouter;
    // Lower bound for the block timestamp of a "latest" proof; 0n disables the check (re-verifying
    // an exported record long after the fact).
    minLatestBlockTs: bigint;
    signal: AbortSignal;
};

/**
 * Verifies proof bytes for one account-bound read under the trusted checkpoint and reads the
 * result plus the header and consensus facts out of those same bytes.
 */
export const verifyProvenRead = async <T>({
    runtime,
    proof,
    read,
    checkpointRoot,
    router,
    minLatestBlockTs,
    signal,
}: VerifyProvenReadParams<T>): Promise<StepResult<VerifiedReadFacts<T>>> => {
    let value: T;
    const context = runtime.createVerifyCtx(
        proof,
        read.method,
        read.argsJson,
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
        const parsed = read.parseResult(result.value);
        if (!parsed.success) return parsed;
        value = parsed.value;
    } finally {
        runtime.freeVerifyCtx(context);
    }

    // Both parses read the exact bytes that just verified; see extractAuthenticatedHeader.
    const decoded = runtime.decodeProof(proof);
    const header = extractAuthenticatedHeader(decoded, read.address);
    if (!header.success) return fail(header.code, header.detail);
    const consensus = extractConsensusEvidence(decoded);
    if (!consensus.success) return fail('METADATA_UNAVAILABLE', consensus.detail);

    return {
        success: true,
        value: { value, header: header.header, consensus: consensus.consensus },
    };
};

const parseNonceResult = (result: unknown): StepResult<bigint> => {
    const parsed = parseHexQuantity(result);

    return parsed.success
        ? { success: true, value: parsed.value }
        : fail('VERIFICATION_FAILED', parsed.error);
};

export const createNonceRead = (address: string): ProvenRead<bigint> => ({
    method: NONCE_RPC_METHOD,
    argsJson: nonceRequestArgs(address),
    address,
    parseResult: parseNonceResult,
});

export type VerifiedProofFacts = {
    nonce: bigint;
    header: AuthenticatedHeader;
    consensus: ConsensusEvidence;
};

export type VerifyProofBytesParams = Omit<VerifyProvenReadParams<bigint>, 'read'> & {
    address: string;
};

/**
 * Verifies proof bytes for `eth_getTransactionCount(address, "latest")` under the trusted
 * checkpoint and reads the nonce plus the header and consensus facts out of those same bytes.
 * Used by the live verifier and by the offline re-verification of an exported record.
 */
export const verifyProofBytes = async ({
    address,
    ...params
}: VerifyProofBytesParams): Promise<StepResult<VerifiedProofFacts>> => {
    const facts = await verifyProvenRead({ ...params, read: createNonceRead(address) });
    if (!facts.success) return facts;
    const { value: nonce, header, consensus } = facts.value;

    return { success: true, value: { nonce, header, consensus } };
};
