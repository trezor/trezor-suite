import { createAddressConfirmation } from './shared/addressConfirmation';
import {
    type CompatibilityParams,
    type CompatibilityResult,
    type ConnectPopupMethodDefinition,
} from './types';

/**
 * Connect v10 rejects non-bitcoin coins/paths in `getPublicKey`, which broke host apps still on
 * `@trezor/connect` 9.x. For those callers, inject `_v9_compat` so connect restores the v9 btc
 * fallback (e.g. for Ethereum or Tron). A no-op for bitcoin-like calls.
 */
const compatibility = ({
    method,
    payload,
    source,
}: CompatibilityParams<'getPublicKey'>): CompatibilityResult | undefined => {
    if (!source.manifest.npmVersion?.startsWith('9.')) {
        return undefined;
    }

    const patchedPayload = { ...payload, _v9_compat: true };

    return { method, payload: patchedPayload };
};

export const getPublicKey: ConnectPopupMethodDefinition<'getPublicKey'> = {
    ...createAddressConfirmation<'getPublicKey'>(),
    compatibility,
};
