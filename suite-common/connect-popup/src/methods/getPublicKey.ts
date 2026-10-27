import { type CallMethodKeys } from '@trezor/connect';

import { type CompatibilityHookParams, type CompatibilityHookResult } from './types';

/**
 * Connect v10 rejects non-bitcoin coins/paths in `getPublicKey`, which broke host apps still on
 * `@trezor/connect` 9.x. For those callers, inject `_v9_compat` so connect restores the v9 btc
 * fallback (e.g. for Ethereum or Tron). A no-op for bitcoin-like calls.
 */
const compatibilityHook = <M extends CallMethodKeys>({
    method,
    payload,
    source,
}: CompatibilityHookParams<M>): CompatibilityHookResult<M> | undefined => {
    if (method !== 'getPublicKey' || !source.manifest.npmVersion?.startsWith('9.')) {
        return undefined;
    }

    // Spread through `object` to avoid distributing over the huge `payload` union (TS2590).
    const patchedPayload = { ...(payload as object), _v9_compat: true };

    return { method, payload: patchedPayload } as unknown as CompatibilityHookResult<M>;
};

export const getPublicKeyV9Compat = { compatibilityHook };
