import { COLIBRI_REVISION, parseVerifiedNonceRequest } from '@suite/colibri-nonce-verifier';
import type {
    NonceFailure,
    NonceFailureCode,
    NonceVerifierInfo,
    VerifiedNonce,
    VerifiedNonceRequest,
    VerifiedNonceResult,
} from '@suite/desktop-app-api';
import { type Deferred, createDeferred } from '@trezor/utils';

// Everything the worker sends back crosses a process boundary, so it arrives untyped.
export type VerifierWorker = {
    verify: (request: VerifiedNonceRequest) => Promise<unknown>;
    getInfo: () => Promise<unknown>;
    cancel: (requestId: string) => Promise<unknown>;
    dispose: () => void;
    watchExit: (listener: () => void) => void;
};

export type VerifiedNonceControllerDeps = {
    startWorker: () => Promise<VerifierWorker>;
    logger: { warn: (message: string) => void };
    // How long a cancelled job may keep the worker busy before the process is killed instead.
    cancelGraceMs?: number;
};

export type VerifiedNonceController = {
    verify: (request: unknown) => Promise<VerifiedNonceResult>;
    cancel: (requestId: unknown) => Promise<void>;
    getInfo: () => Promise<NonceVerifierInfo>;
    dispose: () => void;
};

type Job = {
    request: VerifiedNonceRequest;
    deferred: Deferred<VerifiedNonceResult>;
    isSettled: boolean;
    isCancelRequested: boolean;
};

const DEFAULT_CANCEL_GRACE_MS = 5_000;
const DECIMAL = /^(0|[1-9][0-9]*)$/;
const HEX32 = /^0x[0-9a-f]{64}$/;

const FAILURE_CODES: ReadonlySet<NonceFailureCode> = new Set<NonceFailureCode>([
    'UNSUPPORTED_CHAIN',
    'INVALID_REQUEST',
    'TRUST_CONFIG_INVALID',
    'NATIVE_UNAVAILABLE',
    'PROVIDER_UNAVAILABLE',
    'INVALID_PROOF',
    'STALE_PROOF',
    'CLOCK_INVALID',
    'METADATA_UNAVAILABLE',
    'LIMIT_EXCEEDED',
    'TIMEOUT',
    'CANCELLED',
    'WORKER_CRASHED',
    'VERIFICATION_FAILED',
]);

const RETRYABLE_CODES: ReadonlySet<NonceFailureCode> = new Set<NonceFailureCode>([
    'PROVIDER_UNAVAILABLE',
    'STALE_PROOF',
    'METADATA_UNAVAILABLE',
    'TIMEOUT',
    'WORKER_CRASHED',
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const failure = (requestId: string, code: NonceFailureCode): NonceFailure => ({
    status: 'failed',
    requestId,
    code,
    retryable: RETRYABLE_CODES.has(code),
});

const isEvidence = (value: unknown): boolean =>
    isRecord(value) &&
    /^[0-9a-f]{64}$/.test(String(value.proofSha256)) &&
    typeof value.proofHex === 'string' &&
    /^0x(?:[0-9a-f]{2})+$/.test(value.proofHex) &&
    typeof value.proofFormatVersion === 'string' &&
    isRecord(value.header) &&
    isRecord(value.consensus) &&
    isRecord(value.trust) &&
    isRecord(value.endpoints) &&
    isRecord(value.transfer);

const isVerifiedEnvelope = (
    value: Record<string, unknown>,
    request: VerifiedNonceRequest,
): value is VerifiedNonce => {
    const { block, verifier } = value;

    return (
        isEvidence(value.evidence) &&
        value.status === 'verified' &&
        value.requestId === request.requestId &&
        value.chainId === '1' &&
        value.address === request.address.toLowerCase() &&
        typeof value.nonce === 'string' &&
        DECIMAL.test(value.nonce) &&
        isRecord(block) &&
        typeof block.hash === 'string' &&
        HEX32.test(block.hash) &&
        typeof block.number === 'string' &&
        DECIMAL.test(block.number) &&
        typeof block.timestampSeconds === 'string' &&
        DECIMAL.test(block.timestampSeconds) &&
        block.status === 'authenticated-recent' &&
        Number.isFinite(value.verifiedAtMs) &&
        Number.isFinite(value.expiresAtMs) &&
        isRecord(verifier) &&
        verifier.location === 'desktop' &&
        verifier.runtime === 'native' &&
        typeof verifier.revision === 'string' &&
        typeof verifier.trustPolicyId === 'string'
    );
};

// Only an envelope that names this exact request, chain and address may reach the renderer.
const parseResult = (value: unknown, request: VerifiedNonceRequest): VerifiedNonceResult => {
    if (!isRecord(value)) return failure(request.requestId, 'VERIFICATION_FAILED');
    if (isVerifiedEnvelope(value, request)) return value;
    if (
        value.status === 'failed' &&
        value.requestId === request.requestId &&
        typeof value.code === 'string' &&
        FAILURE_CODES.has(value.code as NonceFailureCode)
    ) {
        return failure(request.requestId, value.code as NonceFailureCode);
    }

    return failure(request.requestId, 'VERIFICATION_FAILED');
};

const unavailableInfo = (
    unavailableCode: NonNullable<NonceVerifierInfo['unavailableCode']>,
): NonceVerifierInfo => ({
    isAvailable: false,
    runtime: 'unavailable',
    revision: COLIBRI_REVISION,
    trustPolicyId: null,
    unavailableCode,
});

const isInfo = (value: unknown): value is NonceVerifierInfo =>
    isRecord(value) &&
    typeof value.isAvailable === 'boolean' &&
    (value.runtime === 'native' || value.runtime === 'unavailable') &&
    typeof value.revision === 'string' &&
    (value.trustPolicyId === null || typeof value.trustPolicyId === 'string') &&
    (value.unavailableCode === null ||
        value.unavailableCode === 'NATIVE_UNAVAILABLE' ||
        value.unavailableCode === 'TRUST_CONFIG_INVALID' ||
        value.unavailableCode === 'UNSUPPORTED_CHAIN');

const sameAccount = (a: VerifiedNonceRequest, b: VerifiedNonceRequest) =>
    a.chainId === b.chainId && a.address.toLowerCase() === b.address.toLowerCase();

/**
 * Serializes verification jobs on one worker: at most one active and one queued job, duplicate
 * requests for the same account share the running job, and a newer request replaces the queued
 * one (the user moved on). Late or malformed worker replies never reach the renderer.
 */
export const createVerifiedNonceController = (
    deps: VerifiedNonceControllerDeps,
): VerifiedNonceController => {
    const cancelGraceMs = deps.cancelGraceMs ?? DEFAULT_CANCEL_GRACE_MS;
    let worker: VerifierWorker | null = null;
    let startingWorker: Promise<VerifierWorker> | null = null;
    let active: Job | null = null;
    let queued: Job | null = null;

    const settle = (job: Job, result: VerifiedNonceResult) => {
        if (job.isSettled) return;
        job.isSettled = true;
        job.deferred.resolve(result);
    };

    const runJob = (job: Job) => {
        active = job;
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        executeJob(job).then(result => finishJob(job, result));
    };

    // A job is released exactly once, whether by its result, a worker exit, a cancel or dispose.
    const finishJob = (job: Job, result: VerifiedNonceResult) => {
        settle(job, result);
        if (active !== job) return;
        active = null;
        if (queued) {
            const next = queued;
            queued = null;
            runJob(next);
        }
    };

    const releaseActiveJob = (code: 'CANCELLED' | 'WORKER_CRASHED') => {
        if (active && !active.isSettled) {
            finishJob(
                active,
                failure(active.request.requestId, active.isCancelRequested ? 'CANCELLED' : code),
            );
        }
    };

    const getWorker = (): Promise<VerifierWorker> => {
        if (worker) return Promise.resolve(worker);
        if (!startingWorker) {
            startingWorker = deps
                .startWorker()
                .then(started => {
                    started.watchExit(() => {
                        if (worker === started) worker = null;
                        releaseActiveJob('WORKER_CRASHED');
                    });
                    worker = started;

                    return started;
                })
                .finally(() => {
                    startingWorker = null;
                });
        }

        return startingWorker;
    };

    const executeJob = async (job: Job): Promise<VerifiedNonceResult> => {
        let started: VerifierWorker;
        try {
            started = await getWorker();
        } catch (error) {
            deps.logger.warn(`verifier worker unavailable: ${String(error)}`);

            return failure(job.request.requestId, 'NATIVE_UNAVAILABLE');
        }
        try {
            return parseResult(await started.verify(job.request), job.request);
        } catch {
            return failure(
                job.request.requestId,
                job.isCancelRequested ? 'CANCELLED' : 'WORKER_CRASHED',
            );
        }
    };

    const verify: VerifiedNonceController['verify'] = value => {
        const parsed = parseVerifiedNonceRequest(value);
        if (!parsed.ok) return Promise.resolve(failure(parsed.requestId, parsed.code));
        const { request } = parsed;

        const shared = [active, queued].find(job => job && sameAccount(job.request, request));
        if (shared) {
            return shared.deferred.promise.then(result => ({
                ...result,
                requestId: request.requestId,
            }));
        }

        const job: Job = {
            request,
            deferred: createDeferred<VerifiedNonceResult>(),
            isSettled: false,
            isCancelRequested: false,
        };
        if (!active) {
            runJob(job);
        } else {
            if (queued) settle(queued, failure(queued.request.requestId, 'CANCELLED'));
            queued = job;
        }

        return job.deferred.promise;
    };

    const getCurrentWorker = (): Promise<VerifierWorker | null> => {
        if (worker) return Promise.resolve(worker);

        return startingWorker?.catch(() => null) ?? Promise.resolve(null);
    };

    const cancel: VerifiedNonceController['cancel'] = async requestId => {
        if (typeof requestId !== 'string') return;
        if (queued?.request.requestId === requestId) {
            settle(queued, failure(requestId, 'CANCELLED'));
            queued = null;

            return;
        }
        if (active?.request.requestId !== requestId || active.isSettled) return;

        const job = active;
        job.isCancelRequested = true;
        const current = await getCurrentWorker();
        await current?.cancel(requestId).catch(() => undefined);
        const isSettledInTime = await Promise.race([
            job.deferred.promise.then(() => true),
            new Promise<boolean>(resolve => {
                setTimeout(() => resolve(false), cancelGraceMs);
            }),
        ]);
        // A synchronous native call cannot be interrupted; killing the process is the only way out.
        if (!isSettledInTime) {
            current?.dispose();
            finishJob(job, failure(requestId, 'CANCELLED'));
        }
    };

    const getInfo: VerifiedNonceController['getInfo'] = async () => {
        try {
            const info = await (await getWorker()).getInfo();

            return isInfo(info) ? info : unavailableInfo('NATIVE_UNAVAILABLE');
        } catch (error) {
            deps.logger.warn(`verifier info unavailable: ${String(error)}`);

            return unavailableInfo('NATIVE_UNAVAILABLE');
        }
    };

    const dispose = () => {
        if (queued) settle(queued, failure(queued.request.requestId, 'CANCELLED'));
        queued = null;
        if (active) active.isCancelRequested = true;
        releaseActiveJob('CANCELLED');
        const current = worker;
        worker = null;
        current?.dispose();
        startingWorker?.then(started => started.dispose()).catch(() => undefined);
    };

    return { verify, cancel, getInfo, dispose };
};
