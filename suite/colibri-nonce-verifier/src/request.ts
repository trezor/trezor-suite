import type { VerifiedNonceRequest } from '@suite/desktop-app-api';

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
