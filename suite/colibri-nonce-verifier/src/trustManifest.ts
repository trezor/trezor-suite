export type TrustManifestCheckpoint = {
    // Beacon block root of the finalized checkpoint the light client bootstraps from.
    root: string;
    epoch: number;
    slot: number;
    timestampSeconds: number;
    // Where the root was obtained and cross-checked (for the review record, not used at runtime).
    sources: string[];
    obtainedAt: string;
};

export type TrustManifestEndpoints = {
    prover: string[];
    // Also the trust-anchor sources for light-client bootstrap and update data.
    beaconApi: string[];
    // Answer the weak-subjectivity cross-check (`finality_checkpoints`).
    checkpointz: string[];
};

export type TrustManifest = {
    policyId: string;
    policyVersion: number;
    chainId: '1';
    checkpoint: TrustManifestCheckpoint;
    endpoints: TrustManifestEndpoints;
    reviewExpiresAt: string;
};

export type TrustManifestResult =
    { success: true; manifest: TrustManifest } | { success: false; error: string };

const HEX32 = /^0x[0-9a-f]{64}$/;
const POLICY_ID = /^[A-Za-z0-9._-]{1,64}$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const isHttpsUrlList = (value: unknown): value is string[] =>
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(entry => typeof entry === 'string' && /^https:\/\/[^\s"]+$/.test(entry));

const isNonNegativeInteger = (value: unknown): value is number =>
    typeof value === 'number' && Number.isInteger(value) && value >= 0;

const parseIsoDate = (value: unknown): number | null => {
    if (typeof value !== 'string') return null;
    const parsed = Date.parse(value);

    return Number.isNaN(parsed) ? null : parsed;
};

/**
 * Validates the shipped trust manifest. A missing or expired manifest is a hard failure
 * (`TRUST_CONFIG_INVALID`); it is never replaced by a root learned from a prover response.
 */
export const validateTrustManifest = (raw: unknown, nowMs: number): TrustManifestResult => {
    if (!isRecord(raw)) return { success: false, error: 'manifest is not an object' };
    const { policyId, policyVersion, chainId, checkpoint, endpoints, reviewExpiresAt } = raw;

    if (typeof policyId !== 'string' || !POLICY_ID.test(policyId)) {
        return { success: false, error: 'invalid policyId' };
    }
    if (!isNonNegativeInteger(policyVersion))
        return { success: false, error: 'invalid policyVersion' };
    if (chainId !== '1') return { success: false, error: 'unsupported chainId' };

    if (!isRecord(checkpoint)) return { success: false, error: 'checkpoint missing' };
    if (typeof checkpoint.root !== 'string' || !HEX32.test(checkpoint.root)) {
        return { success: false, error: 'invalid checkpoint root' };
    }
    if (!isNonNegativeInteger(checkpoint.epoch) || !isNonNegativeInteger(checkpoint.slot)) {
        return { success: false, error: 'invalid checkpoint epoch/slot' };
    }
    if (!isNonNegativeInteger(checkpoint.timestampSeconds) || checkpoint.timestampSeconds === 0) {
        return { success: false, error: 'invalid checkpoint timestamp' };
    }
    if (!Array.isArray(checkpoint.sources) || checkpoint.sources.length === 0) {
        return { success: false, error: 'checkpoint sources missing' };
    }
    if (parseIsoDate(checkpoint.obtainedAt) === null) {
        return { success: false, error: 'invalid checkpoint obtainedAt' };
    }

    if (!isRecord(endpoints)) return { success: false, error: 'endpoints missing' };
    if (
        !isHttpsUrlList(endpoints.prover) ||
        !isHttpsUrlList(endpoints.beaconApi) ||
        !isHttpsUrlList(endpoints.checkpointz)
    ) {
        return { success: false, error: 'endpoints must be non-empty https lists' };
    }

    const expiresAtMs = parseIsoDate(reviewExpiresAt);
    if (expiresAtMs === null) return { success: false, error: 'invalid reviewExpiresAt' };
    if (expiresAtMs <= nowMs) return { success: false, error: 'trust manifest review expired' };

    return {
        success: true,
        manifest: {
            policyId,
            policyVersion,
            chainId,
            checkpoint: {
                root: checkpoint.root,
                epoch: checkpoint.epoch,
                slot: checkpoint.slot,
                timestampSeconds: checkpoint.timestampSeconds,
                sources: checkpoint.sources.filter(
                    (source): source is string => typeof source === 'string',
                ),
                obtainedAt: checkpoint.obtainedAt as string,
            },
            endpoints: {
                prover: endpoints.prover,
                beaconApi: endpoints.beaconApi,
                checkpointz: endpoints.checkpointz,
            },
            reviewExpiresAt: reviewExpiresAt as string,
        },
    };
};
