import type { C4Runtime } from '@corpus-core/colibri-stateless';
import { sha256 } from '@noble/hashes/sha2.js';

import type {
    NonceFailure,
    NonceVerifierInfo,
    VerifiedBlock,
    VerifiedNonceEvidence,
    VerifiedNonceRequest,
    VerifiedNonceResult,
    VerifierIdentity,
} from '@suite/desktop-app-api';

import {
    type VerifiedAccountStateResult,
    type VerifiedAccountStateValue,
    createAccountStateRead,
} from './accountState';
import {
    COLIBRI_REVISION,
    type ColibriRuntimeHandle,
    type ColibriRuntimeKind,
    type GetColibriRuntime,
    loadColibriRuntime,
} from './colibriRuntime';
import { createNonceFailure } from './errors';
import { checkFreshness, getExpiresAtMs, getMinLatestBlockTimestamp } from './freshness';
import { bytesToHex, hexToBytes, toDecimalString } from './quantity';
import {
    type VerifiedAccountStateRequest,
    parseVerifiedAccountStateRequest,
    parseVerifiedNonceRequest,
} from './request';
import {
    type AbortReason,
    DEFAULT_REQUEST_LIMITS,
    type FetchLike,
    type RequestRouter,
    type RequestRouterLimits,
    createRequestRouter,
} from './requestRouter';
import { type ColibriStorage, hasSyncState } from './storage';
import { type TrustManifest, validateTrustManifest } from './trustManifest';
import {
    CHAIN_ID,
    type Failure,
    type ProvenRead,
    type StepResult,
    type VerifiedReadFacts,
    createNonceRead,
    driveRuntime,
    fail,
    verifyProvenRead,
} from './verifyProofBytes';

export const JOB_TIMEOUT_MS = 60_000;
// Below this much remaining time a warm retry after a cold-start stale proof is not worth it.
const MIN_REMAINING_MS_FOR_RETRY = 20_000;

const METHOD_TYPE_PROOFABLE = 1;
const VERIFY_FLAG_PROOF_ONLY = 1 << 3;
const PROVER_MODE_REMOTE = 1;

export type NonceVerifierClock = {
    nowMs: () => number;
    monotonicMs: () => number;
};

export type NonceVerifierLogger = {
    info: (message: string) => void;
    warn: (message: string) => void;
};

export type NonceVerifierDeps = {
    clock: NonceVerifierClock;
    fetch: FetchLike;
    logger: NonceVerifierLogger;
    getColibriRuntime: GetColibriRuntime;
};

export type NonceVerifierConfig = {
    trustManifest: unknown;
    storage: ColibriStorage;
    allowedRuntimeKinds: readonly ColibriRuntimeKind[];
    limits?: RequestRouterLimits;
};

export type NonceVerifier = {
    getInfo: () => Promise<NonceVerifierInfo>;
    verify: (request: VerifiedNonceRequest, signal?: AbortSignal) => Promise<VerifiedNonceResult>;
    // Code hash and storage words of one account, proven by a single `eth_getProof`.
    verifyAccountState: (
        request: VerifiedAccountStateRequest,
        signal?: AbortSignal,
    ) => Promise<VerifiedAccountStateResult>;
};

type BuildEvidenceParams = {
    proof: Uint8Array;
    facts: VerifiedReadFacts<unknown>;
    manifest: TrustManifest;
    router: RequestRouter;
    durationMs: number;
    isColdStart: boolean;
};

const buildEvidence = ({
    proof,
    facts,
    manifest,
    router,
    durationMs,
    isColdStart,
}: BuildEvidenceParams): VerifiedNonceEvidence => {
    const stats = router.getStats();

    return {
        proofSha256: bytesToHex(sha256(proof)).slice(2),
        proofHex: bytesToHex(proof),
        proofFormatVersion: facts.consensus.proofFormatVersion,
        header: { parentHash: facts.header.parentHash, stateRoot: facts.header.stateRoot },
        consensus: {
            slot: toDecimalString(facts.consensus.slot),
            signedSlot: toDecimalString(facts.consensus.signedSlot),
            headerProof: facts.consensus.headerProof,
            syncCommitteeParticipants: facts.consensus.syncCommitteeParticipants,
            syncCommitteePeriod: toDecimalString(facts.consensus.syncCommitteePeriod),
        },
        trust: {
            policyId: manifest.policyId,
            policyVersion: manifest.policyVersion,
            checkpointRoot: manifest.checkpoint.root,
            checkpointEpoch: String(manifest.checkpoint.epoch),
        },
        endpoints: router.getEndpointsUsed(),
        transfer: {
            requestCount: stats.requestCount,
            bytesReceived: stats.bytesReceived,
            durationMs,
            isColdStart,
        },
    };
};

export const createNonceVerifier = (
    deps: NonceVerifierDeps,
    config: NonceVerifierConfig,
): NonceVerifier => {
    const limits = config.limits ?? DEFAULT_REQUEST_LIMITS;
    let runtimeHandle: ColibriRuntimeHandle | null = null;
    let runtimeFailure: Failure | null = null;
    // One Colibri runtime per process and global state inside it: jobs never overlap.
    let queue: Promise<unknown> = Promise.resolve();

    const getManifest = (): StepResult<TrustManifest> => {
        const validated = validateTrustManifest(config.trustManifest, deps.clock.nowMs());

        return validated.success
            ? { success: true, value: validated.manifest }
            : fail('TRUST_CONFIG_INVALID', validated.error);
    };

    const getRuntimeHandle = async (): Promise<StepResult<ColibriRuntimeHandle>> => {
        if (runtimeHandle) return { success: true, value: runtimeHandle };
        if (runtimeFailure) return { success: false, failure: runtimeFailure };
        const loaded = await loadColibriRuntime({
            getRuntime: deps.getColibriRuntime,
            storage: config.storage,
            allowedRuntimeKinds: config.allowedRuntimeKinds,
        });
        if (!loaded.success) {
            runtimeFailure = { code: loaded.code, detail: loaded.detail };

            return { success: false, failure: runtimeFailure };
        }
        runtimeHandle = loaded.handle;

        return { success: true, value: loaded.handle };
    };

    const getInfo = async (): Promise<NonceVerifierInfo> => {
        const manifest = getManifest();
        const runtime = await getRuntimeHandle();
        let unavailableCode: NonceVerifierInfo['unavailableCode'] = null;
        if (!manifest.success) unavailableCode = 'TRUST_CONFIG_INVALID';
        else if (!runtime.success) unavailableCode = 'NATIVE_UNAVAILABLE';

        return {
            isAvailable: unavailableCode === null,
            runtime: runtime.success && runtime.value.kind === 'native' ? 'native' : 'unavailable',
            revision: COLIBRI_REVISION,
            trustPolicyId: manifest.success ? manifest.value.policyId : null,
            unavailableCode,
        };
    };

    const acquireProof = async (
        runtime: C4Runtime,
        read: ProvenRead<unknown>,
        router: RequestRouter,
        minLatestBlockTs: bigint,
        signal: AbortSignal,
    ): Promise<StepResult<Uint8Array>> => {
        // A cached header would be advertised to the prover as `last_block_hash`, which lets it
        // omit the header proof; a full clProof is required for the metadata binding below.
        runtime.resetCaches();
        const context = runtime.createRpcCtx(
            read.method,
            read.argsJson,
            CHAIN_ID,
            0,
            VERIFY_FLAG_PROOF_ONLY,
            PROVER_MODE_REMOTE,
        );
        try {
            runtime.rpcCtxSetMinLatestBlockTs(context, minLatestBlockTs);
            const result = await driveRuntime(
                runtime,
                () => runtime.executeRpcCtx(context),
                router,
                'acquire',
                signal,
            );
            if (!result.success) return result;
            const proof = hexToBytes(result.value);
            if (!proof || proof.length === 0) {
                return fail('PROVIDER_UNAVAILABLE', 'prover returned no proof bytes');
            }

            return { success: true, value: proof };
        } finally {
            runtime.freeRpcCtx(context);
        }
    };

    type ProvenFacts<T> = {
        value: T;
        block: VerifiedBlock;
        verifiedAtMs: number;
        expiresAtMs: number;
        verifier: VerifierIdentity;
        evidence: VerifiedNonceEvidence;
    };

    // Acquires and verifies one read: trust anchor, runtime, prover round-trip, verification
    // against the checkpoint, header binding and freshness. Shared by every proven read.
    const runProofJob = async <T>(
        read: ProvenRead<T>,
        controller: AbortController,
    ): Promise<StepResult<ProvenFacts<T>>> => {
        const { signal } = controller;
        const startedMonotonicMs = deps.clock.monotonicMs();
        const startedWallMs = deps.clock.nowMs();
        const deadline = setTimeout(
            () => controller.abort({ code: 'TIMEOUT' } satisfies AbortReason),
            JOB_TIMEOUT_MS,
        );
        const isColdStart = !hasSyncState(config.storage, CHAIN_ID);
        const elapsedMs = () => Math.round(deps.clock.monotonicMs() - startedMonotonicMs);

        const finish = <R>(outcome: StepResult<R>, router: RequestRouter | null): StepResult<R> => {
            clearTimeout(deadline);
            const stats = router?.getStats() ?? { requestCount: 0, bytesReceived: 0 };
            const summary = `${read.method} ${isColdStart ? 'cold' : 'warm'} ${elapsedMs()}ms ${stats.requestCount} requests ${stats.bytesReceived} bytes`;
            if (outcome.success) {
                deps.logger.info(`verified ${summary}`);
            } else {
                deps.logger.warn(`${outcome.failure.code} (${outcome.failure.detail}) ${summary}`);
            }

            return outcome;
        };

        const manifest = getManifest();
        if (!manifest.success) return finish(manifest, null);
        if (startedWallMs < manifest.value.checkpoint.timestampSeconds * 1000) {
            return finish(fail('CLOCK_INVALID', 'wall clock precedes trusted checkpoint'), null);
        }
        const loaded = await getRuntimeHandle();
        if (!loaded.success) return finish(loaded, null);
        const { runtime, revision } = loaded.value;

        if (
            runtime.getMethodType(CHAIN_ID, read.method, read.argsJson, 0) !== METHOD_TYPE_PROOFABLE
        ) {
            return finish(fail('VERIFICATION_FAILED', 'method not proofable'), null);
        }

        const router = createRequestRouter(
            {
                fetch: deps.fetch,
                onEndpointFailure: ({ phase, type, nodeIndex, reason }) =>
                    deps.logger.warn(`${phase} ${type} endpoint #${nodeIndex}: ${reason}`),
            },
            { endpoints: manifest.value.endpoints, limits, signal },
        );

        const attempt = async (): Promise<StepResult<ProvenFacts<T>>> => {
            const minLatestBlockTs = getMinLatestBlockTimestamp(deps.clock.nowMs());
            const proof = await acquireProof(runtime, read, router, minLatestBlockTs, signal);
            if (!proof.success) return proof;
            const facts = await verifyProvenRead({
                runtime,
                proof: proof.value,
                read,
                checkpointRoot: manifest.value.checkpoint.root,
                router,
                minLatestBlockTs,
                signal,
            });
            if (!facts.success) return facts;

            const verifiedAtMs = deps.clock.nowMs();
            if (verifiedAtMs < startedWallMs) {
                return fail('CLOCK_INVALID', 'wall clock moved backwards during the job');
            }
            const { header } = facts.value;
            const freshness = checkFreshness({
                timestampSeconds: header.timestampSeconds,
                nowMs: verifiedAtMs,
            });
            if (!freshness.ok)
                return fail(freshness.code, 'authenticated timestamp outside window');

            return {
                success: true,
                value: {
                    value: facts.value.value,
                    block: {
                        hash: header.blockHash,
                        number: toDecimalString(header.blockNumber),
                        timestampSeconds: toDecimalString(header.timestampSeconds),
                        status: 'authenticated-recent',
                    },
                    verifiedAtMs,
                    expiresAtMs: getExpiresAtMs(header.timestampSeconds),
                    verifier: {
                        location: 'desktop',
                        runtime: 'native',
                        revision,
                        trustPolicyId: manifest.value.policyId,
                    },
                    evidence: buildEvidence({
                        proof: proof.value,
                        facts: facts.value,
                        manifest: manifest.value,
                        router,
                        durationMs: elapsedMs(),
                        isColdStart,
                    }),
                },
            };
        };

        let outcome = await attempt();
        // A cold bootstrap can consume most of the freshness window on its own; one warm retry
        // within the same deadline is bounded and usually enough.
        if (
            !outcome.success &&
            outcome.failure.code === 'STALE_PROOF' &&
            isColdStart &&
            JOB_TIMEOUT_MS - elapsedMs() >= MIN_REMAINING_MS_FOR_RETRY
        ) {
            deps.logger.info('cold start produced a stale proof, retrying once warm');
            outcome = await attempt();
        }

        return finish(outcome, router);
    };

    type EnqueueJobParams<R> = {
        requestId: string;
        externalSignal: AbortSignal | undefined;
        run: (controller: AbortController) => Promise<R>;
    };

    // One Colibri runtime with global state inside it: every proven read waits for the previous
    // one, whatever its kind.
    const enqueueJob = <R>({
        requestId,
        externalSignal,
        run,
    }: EnqueueJobParams<R>): Promise<R | NonceFailure> => {
        const controller = new AbortController();
        const onExternalAbort = () => controller.abort({ code: 'CANCELLED' } satisfies AbortReason);
        if (externalSignal?.aborted) onExternalAbort();
        externalSignal?.addEventListener('abort', onExternalAbort, { once: true });

        const job = queue.then(() =>
            run(controller).finally(() =>
                externalSignal?.removeEventListener('abort', onExternalAbort),
            ),
        );
        queue = job.catch(() => undefined);

        return job.catch((error: unknown) => {
            deps.logger.warn(
                `unexpected verifier error: ${error instanceof Error ? error.message : 'unknown'}`,
            );

            return createNonceFailure(requestId, 'VERIFICATION_FAILED');
        });
    };

    const verify: NonceVerifier['verify'] = (request, externalSignal) => {
        const parsed = parseVerifiedNonceRequest(request);
        if (!parsed.ok) return Promise.resolve(createNonceFailure(parsed.requestId, parsed.code));
        const { requestId } = parsed.request;
        const address = parsed.request.address.toLowerCase();

        return enqueueJob({
            requestId,
            externalSignal,
            run: async (controller): Promise<VerifiedNonceResult> => {
                const outcome = await runProofJob(createNonceRead(address), controller);
                if (!outcome.success) return createNonceFailure(requestId, outcome.failure.code);
                const { value: nonce, ...facts } = outcome.value;

                return {
                    status: 'verified',
                    requestId,
                    chainId: '1',
                    address,
                    nonce: toDecimalString(nonce),
                    ...facts,
                };
            },
        });
    };

    const verifyAccountState: NonceVerifier['verifyAccountState'] = (request, externalSignal) => {
        const parsed = parseVerifiedAccountStateRequest(request);
        if (!parsed.ok) return Promise.resolve(createNonceFailure(parsed.requestId, parsed.code));
        const { requestId, storageKeys } = parsed.request;
        const address = parsed.request.address.toLowerCase();

        return enqueueJob({
            requestId,
            externalSignal,
            run: async (controller): Promise<VerifiedAccountStateResult> => {
                const outcome = await runProofJob<VerifiedAccountStateValue>(
                    createAccountStateRead({ address, storageKeys }),
                    controller,
                );
                if (!outcome.success) return createNonceFailure(requestId, outcome.failure.code);
                const { value: state, ...facts } = outcome.value;

                return {
                    status: 'verified',
                    requestId,
                    chainId: '1',
                    address,
                    codeHash: state.codeHash,
                    storage: state.storage,
                    ...facts,
                };
            },
        });
    };

    return { getInfo, verify, verifyAccountState };
};
