/**
 * Storage for the WARD owner on Suite Sync.
 *
 * The production Suite Sync relay admits only Evolu owners for which the Quota Manager holds a
 * storage limit, and accepts a write only while the owner stays within it. Suite gets that limit for
 * its own owner by moving part of the device's quota to it, in a request signed with the key the
 * device delegates for Suite Sync. WARD reuses the same device registration and the same signed
 * request, for the WARD owner: no second device identity, and the Quota Manager learns only that
 * this device funds one more owner and how large it is.
 *
 * WHO CALLS THIS. Whoever holds the delegated key: Suite, or a tool driving the device (connect-cli).
 * wardd never holds it. wardd reports how much storage its owner needs (`replication.needBytes`),
 * the holder allocates it here, and wardd notices the larger limit and resynchronizes.
 *
 * The wire formats follow Suite's Quota Manager client (`suite-common/suite-sync-quota-manager`):
 * the same endpoints, the same `EvoluAddSpaceToOwnerV1` message and the same P-256 signature.
 */
import { p256 } from '@noble/curves/nist.js';
import { bytesToHex, hexToBytes, randomBytes } from '@noble/hashes/utils.js';

import { concatBytes, u32 } from './bytes';

/** Where Suite Sync runs; the same table as Suite's `relayUrl.ts` and `quotaManagerUrl.ts`. */
export type SuiteSyncEnvironment = 'local' | 'dev' | 'prod';

export interface SuiteSyncEndpoints {
    /** the Evolu relay; an http(s) URL, as Suite stores it */
    relayUrl: string;
    quotaManagerUrl: string;
}

export const SUITE_SYNC_ENDPOINTS: Record<SuiteSyncEnvironment, SuiteSyncEndpoints> = {
    local: {
        relayUrl: 'http://127.0.0.1:4000/evolu/',
        quotaManagerUrl: 'http://127.0.0.1:4001/',
    },
    dev: {
        relayUrl: 'https://suite-sync-dev.suite.sldev.cz/evolu/',
        quotaManagerUrl: 'https://suite-sync-dev.suite.sldev.cz/quota-manager/',
    },
    prod: {
        relayUrl: 'https://suite-sync.trezor.io/evolu/',
        quotaManagerUrl: 'https://suite-sync.trezor.io/quota-manager/',
    },
};

/** How much the WARD owner asks for at a time. A transition record is a few kilobytes at most. */
export const WARD_STORAGE_INCREMENT = 64 * 1024;

/** Allocate again once less than this is left, so that a write never waits for an allocation. */
export const WARD_STORAGE_RESERVE = 16 * 1024;

/**
 * What the WARD owner leaves of the device's unspent quota for Suite's own data: WARD never takes
 * the last of it.
 */
export const SUITE_SYNC_RESERVE = 64 * 1024;

/**
 * How many bytes to allocate now, for an owner that stores about `storedBytes` and may store
 * `limitBytes` (null: no storage at all). Zero when the owner has enough.
 */
export const wardStorageNeed = (params: {
    storedBytes: number;
    limitBytes: number | null;
    refused?: boolean;
}): number => {
    const { storedBytes, limitBytes, refused } = params;
    if (limitBytes === null) return WARD_STORAGE_INCREMENT;
    if (refused || storedBytes + WARD_STORAGE_RESERVE > limitBytes) {
        // enough to get back above the reserve, in whole increments
        const short = storedBytes + WARD_STORAGE_RESERVE - limitBytes;

        return Math.max(1, Math.ceil(short / WARD_STORAGE_INCREMENT)) * WARD_STORAGE_INCREMENT;
    }

    return 0;
};

export type QuotaFetch = (
    url: string,
    init: { method: 'POST'; headers: Record<string, string>; body: string },
) => Promise<{ status: number; json(): Promise<unknown> }>;

export class QuotaManagerError extends Error {
    constructor(
        /**
         * `unreachable`: no answer, or an answer that is not the Quota Manager's;
         * `no_device_quota`: the device is not registered, or has too little unspent quota;
         * `refused`: the Quota Manager rejected the request (a stale challenge, a bad proof).
         */
        readonly kind: 'unreachable' | 'no_device_quota' | 'refused',
        message: string,
    ) {
        super(message);
        this.name = 'QuotaManagerError';
    }
}

export interface QuotaManagerOptions {
    quotaManagerUrl: string;
    fetch?: QuotaFetch;
    /** per request */
    timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * A Suite version the Quota Manager answers in its current form (`NoQuota` rather than 404). Older
 * replies are understood too.
 */
const CLIENT_VERSION = '26.4.0';

const post = async (
    opts: QuotaManagerOptions,
    route: string,
    body: Record<string, unknown>,
): Promise<{ status: number; body: Record<string, unknown> }> => {
    const url = new URL(route.replace(/^\//, ''), opts.quotaManagerUrl.replace(/\/?$/, '/'));
    const doFetch: QuotaFetch =
        opts.fetch ??
        ((u, init) =>
            fetch(u, {
                ...init,
                signal: AbortSignal.timeout(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
            }));
    let res: Awaited<ReturnType<QuotaFetch>>;
    try {
        res = await doFetch(url.toString(), {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'suite-version': CLIENT_VERSION },
            body: JSON.stringify(body),
        });
    } catch (e) {
        throw new QuotaManagerError('unreachable', `Quota Manager ${url}: ${String(e)}`);
    }
    let parsed: unknown;
    try {
        parsed = await res.json();
    } catch {
        parsed = null;
    }
    if (typeof parsed !== 'object' || parsed === null) {
        throw new QuotaManagerError(
            'unreachable',
            `Quota Manager ${url}: HTTP ${res.status} without a JSON body`,
        );
    }

    return { status: res.status, body: parsed as Record<string, unknown> };
};

/** The owner's storage limit in bytes, or null when the Quota Manager holds none for it. */
export const askOwnerStorage = async (
    opts: QuotaManagerOptions,
    ownerId: string,
): Promise<number | null> => {
    const { status, body } = await post(opts, '/storage/ask', { ownerId });
    if (status === 200 && body.status === 'NoQuota') return null;
    if (status === 404 && body.error === 'OwnerNotFound') return null;
    if (status === 200 && body.status === 'Allocated' && typeof body.totalSpace === 'number') {
        return body.totalSpace;
    }
    throw new QuotaManagerError('unreachable', `unexpected /storage/ask reply: HTTP ${status}`);
};

/** The device's registered quota, or null when the device is not registered. */
export const askDeviceStorage = async (
    opts: QuotaManagerOptions,
    publicKey: string,
): Promise<{ totalSpace: number; unspentSpace: number } | null> => {
    const { status, body } = await post(opts, '/storage/ask', { publicKey });
    if (status === 200 && body.status === 'NoQuota') return null;
    if (status === 404) return null;
    if (
        status === 200 &&
        body.status === 'Allocated' &&
        typeof body.totalSpace === 'number' &&
        typeof body.unspentSpace === 'number'
    ) {
        return { totalSpace: body.totalSpace, unspentSpace: body.unspentSpace };
    }
    throw new QuotaManagerError('unreachable', `unexpected /storage/ask reply: HTTP ${status}`);
};

const ADD_SPACE_TO_OWNER_HEADER = 'EvoluAddSpaceToOwnerV1';

const utf8 = (s: string) => new TextEncoder().encode(s);

/** One length-prefixed chunk, as the Quota Manager frames every signed field. */
const chunk = (bytes: Uint8Array): Uint8Array => {
    if (bytes.length > 0xff) throw new Error('a signed field is at most 255 bytes');

    return concatBytes(Uint8Array.of(bytes.length), bytes);
};

/**
 * A proof of the delegated identity, as Suite makes one (`getProofOfDelegatedIdentity`): the P-256
 * signature over the length-prefixed header and the message that follows it. The device checks one
 * before it hands out the Evolu node (header `EvoluGetNode`); the Quota Manager checks one before it
 * moves quota (`EvoluAddSpaceToOwnerV1`).
 */
export const proofOfDelegatedIdentity = (
    delegatedKey: string,
    header: string,
    message: Uint8Array = new Uint8Array(0),
): string =>
    bytesToHex(p256.sign(concatBytes(chunk(utf8(header)), message), hexToBytes(delegatedKey)));

/** The public key the Quota Manager knows the device by: uncompressed P-256, hex. */
export const delegatedPublicKey = (delegatedKey: string): string =>
    bytesToHex(p256.getPublicKey(hexToBytes(delegatedKey), false));

/** The signed message of `/storage/add`: header, public key, owner, challenge and size. */
export const addSpaceToOwnerMessage = (params: {
    publicKey: string;
    ownerId: string;
    challenge: string;
    size: number;
}): Uint8Array =>
    concatBytes(
        chunk(utf8(ADD_SPACE_TO_OWNER_HEADER)),
        chunk(hexToBytes(params.publicKey)),
        chunk(utf8(params.ownerId)),
        chunk(hexToBytes(params.challenge)),
        chunk(u32(params.size)),
    );

export interface AllocatedStorage {
    /** the bytes moved to the owner by this call */
    allocated: number;
    /** the owner's limit afterwards */
    ownerTotalSpace: number;
    /** what the device has left to give */
    deviceUnspentSpace: number | null;
}

/**
 * Move `size` bytes of the device's quota to the WARD owner. Needs the device's delegated key
 * (hex P-256 private key), which only the caller holds; nothing about the owner but its public
 * identifier is sent.
 */
export const allocateOwnerStorage = async (
    opts: QuotaManagerOptions & { delegatedKey: string; ownerId: string; size: number },
): Promise<AllocatedStorage> => {
    if (!Number.isInteger(opts.size) || opts.size <= 0 || opts.size > 0xffffffff) {
        throw new Error('the size to allocate must be a positive 32-bit integer');
    }
    const sessionId = bytesToHex(randomBytes(16));
    const challengeReply = await post(opts, '/challenge', { sessionId });
    const { challenge } = challengeReply.body;
    if (challengeReply.status !== 200 || typeof challenge !== 'string') {
        throw new QuotaManagerError(
            'unreachable',
            `unexpected /challenge reply: HTTP ${challengeReply.status}`,
        );
    }
    const publicKey = delegatedPublicKey(opts.delegatedKey);
    const proof = bytesToHex(
        p256.sign(
            addSpaceToOwnerMessage({
                publicKey,
                ownerId: opts.ownerId,
                challenge,
                size: opts.size,
            }),
            hexToBytes(opts.delegatedKey),
        ),
    );
    const { status, body } = await post(opts, '/storage/add', {
        publicKey,
        ownerId: opts.ownerId,
        size: opts.size,
        challenge,
        sessionId,
        proof,
    });
    if (status === 200 && typeof body.ownerTotalSpace === 'number') {
        return {
            allocated: opts.size,
            ownerTotalSpace: body.ownerTotalSpace,
            deviceUnspentSpace:
                typeof body.publicKeyUnspentSpace === 'number' ? body.publicKeyUnspentSpace : null,
        };
    }
    if (body.error === 'NoStorageAllowance') {
        throw new QuotaManagerError(
            'no_device_quota',
            'the device has no unspent Suite Sync quota to give (is it registered with Suite Sync?)',
        );
    }
    if (status >= 400 && status < 500) {
        throw new QuotaManagerError('refused', `/storage/add refused: ${JSON.stringify(body)}`);
    }
    throw new QuotaManagerError('unreachable', `unexpected /storage/add reply: HTTP ${status}`);
};

export type EnsureOwnerStorageResult =
    { kind: 'enough'; ownerTotalSpace: number | null } | ({ kind: 'allocated' } & AllocatedStorage);

/**
 * Allocate what the WARD owner needs (`needBytes`, as wardd reports it), within the allocation
 * policy: never more than the device has unspent beyond `SUITE_SYNC_RESERVE`, so Suite's own data
 * keeps room. Throws `no_device_quota` when the device cannot give anything.
 */
export const ensureOwnerStorage = async (
    opts: QuotaManagerOptions & { delegatedKey: string; ownerId: string; needBytes: number },
): Promise<EnsureOwnerStorageResult> => {
    if (opts.needBytes <= 0) {
        return { kind: 'enough', ownerTotalSpace: await askOwnerStorage(opts, opts.ownerId) };
    }
    const device = await askDeviceStorage(opts, delegatedPublicKey(opts.delegatedKey));
    if (device === null) {
        throw new QuotaManagerError(
            'no_device_quota',
            'the device is not registered with Suite Sync; turn Suite Sync on in Suite first',
        );
    }
    const available = device.unspentSpace - SUITE_SYNC_RESERVE;
    if (available <= 0) {
        throw new QuotaManagerError(
            'no_device_quota',
            `the device has ${device.unspentSpace} bytes of Suite Sync quota left, kept for Suite`,
        );
    }

    return {
        kind: 'allocated',
        ...(await allocateOwnerStorage({ ...opts, size: Math.min(opts.needBytes, available) })),
    };
};
