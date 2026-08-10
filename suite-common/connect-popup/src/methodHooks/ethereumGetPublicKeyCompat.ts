import { getNetworkOptional } from '@suite-common/wallet-config';
import { type CallMethodKeys } from '@trezor/connect';

import { type CompatibilityHookParams, type CompatibilityHookResult } from './types';

const isEthereumCoin = (coin: unknown) =>
    typeof coin === 'string' && getNetworkOptional(coin.toLowerCase())?.networkType === 'ethereum';

/**
 * Connect v9 `getPublicKey` accepted non-bitcoin coins (e.g. `coin: "eth"`) and
 * silently fell back to btc. Connect v10 restricted `getPublicKey` to bitcoin-like
 * coins (trezor-suite#30276), rejecting such calls with `Method_UnknownCoin`.
 *
 * Because the popup runs the v10 implementation, that change also broke host apps
 * still pinned to a `9.x` version of `@trezor/connect`. For those callers, rewrite an
 * ethereum-coin `getPublicKey` to `ethereumGetPublicKey`, which derives the network
 * from the path and returns the same HDNode response shape. Callers on a newer version
 * are expected to use `ethereumGetPublicKey` directly and are left untouched.
 */
const compatibilityHook = <M extends CallMethodKeys>({
    method,
    payload,
    source,
}: CompatibilityHookParams<M>): CompatibilityHookResult<M> | undefined => {
    if (method !== 'getPublicKey' || !source.manifest.npmVersion?.startsWith('9.')) {
        return undefined;
    }

    // `getPublicKey` accepts either a single request or a `bundle` of them.
    const isEthereum =
        'bundle' in payload && Array.isArray(payload.bundle)
            ? payload.bundle.length > 0 &&
              payload.bundle.every(batch => isEthereumCoin((batch as { coin?: unknown })?.coin))
            : isEthereumCoin((payload as { coin?: unknown }).coin);

    if (!isEthereum) return undefined;

    return { method: 'ethereumGetPublicKey', payload } as CompatibilityHookResult<M>;
};

export const ethereumGetPublicKeyCompat = { compatibilityHook };
