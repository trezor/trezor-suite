import type { VerifiedNonceRequest } from '@suite/desktop-app-api';

import { MAX_STORAGE_KEYS, isStorageKey } from './accountState';

const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const REQUEST_ID = /^[A-Za-z0-9_-]{1,64}$/;

export type ParsedVerifiedNonceRequest =
    | { ok: true; request: VerifiedNonceRequest }
    | { ok: false; requestId: string; code: 'INVALID_REQUEST' | 'UNSUPPORTED_CHAIN' };

// Shared by the desktop controller (untyped IPC input) and the verifier (defence in depth), so
// both sides agree on what a well-formed request is.
export const parseVerifiedNonceRequest = (value: unknown): ParsedVerifiedNonceRequest => {
    if (
        typeof value !== 'object' ||
        value === null ||
        !('requestId' in value) ||
        typeof value.requestId !== 'string' ||
        !REQUEST_ID.test(value.requestId)
    ) {
        return { ok: false, requestId: '', code: 'INVALID_REQUEST' };
    }
    const { requestId } = value;
    const address = 'address' in value ? value.address : undefined;
    if (typeof address !== 'string' || !ADDRESS.test(address)) {
        return { ok: false, requestId, code: 'INVALID_REQUEST' };
    }
    const chainId = 'chainId' in value ? value.chainId : undefined;
    if (chainId !== '1') return { ok: false, requestId, code: 'UNSUPPORTED_CHAIN' };

    return { ok: true, request: { requestId, chainId: '1', address } };
};

export type VerifiedAccountStateRequest = VerifiedNonceRequest & {
    // 32-byte lowercase hex slots, in the order the result reports them.
    storageKeys: string[];
};

export type ParsedVerifiedAccountStateRequest =
    | { ok: true; request: VerifiedAccountStateRequest }
    | { ok: false; requestId: string; code: 'INVALID_REQUEST' | 'UNSUPPORTED_CHAIN' };

export const parseVerifiedAccountStateRequest = (
    value: unknown,
): ParsedVerifiedAccountStateRequest => {
    const parsed = parseVerifiedNonceRequest(value);
    if (!parsed.ok) return parsed;
    const { request } = parsed;
    const storageKeys =
        typeof value === 'object' && value !== null && 'storageKeys' in value
            ? value.storageKeys
            : undefined;
    if (
        !Array.isArray(storageKeys) ||
        storageKeys.length > MAX_STORAGE_KEYS ||
        !storageKeys.every(isStorageKey) ||
        new Set(storageKeys).size !== storageKeys.length
    ) {
        return { ok: false, requestId: request.requestId, code: 'INVALID_REQUEST' };
    }

    return { ok: true, request: { ...request, storageKeys } };
};
