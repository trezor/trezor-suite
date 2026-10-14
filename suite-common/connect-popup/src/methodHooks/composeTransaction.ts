import { getUnusedChangeAddress } from '@suite-common/wallet-utils';
import type { AccountAddresses, CallMethodKeys, PrecomposeParams } from '@trezor/connect';

import type { CompatibilityHookParams, CompatibilityHookResult } from './types';

type LegacyPrecomposeParams = Omit<PrecomposeParams, 'path' | 'utxo' | 'changeAddress'> & {
    // Former `account` param, since replaced by top-level `path`, `utxo` and `changeAddress`.
    account?: Pick<PrecomposeParams, 'path' | 'utxo'> & {
        addresses: AccountAddresses;
    };
};

const isCurrentPrecomposeParams = (
    params: PrecomposeParams | LegacyPrecomposeParams,
): params is PrecomposeParams =>
    ('path' in params && !!params.path) ||
    ('utxo' in params && !!params.utxo) ||
    ('changeAddress' in params && !!params.changeAddress);

const compatibilityHook = <M extends CallMethodKeys>({
    method,
    payload,
}: CompatibilityHookParams<M>): CompatibilityHookResult<M> | undefined => {
    if (method !== 'composeTransaction') {
        return undefined;
    }

    const typedPayload = payload as PrecomposeParams | LegacyPrecomposeParams;

    if (isCurrentPrecomposeParams(typedPayload)) {
        return { method, payload };
    }

    const { account, ...rest } = typedPayload;

    if (account) {
        const { path, utxo, addresses } = account;
        const changeAddress = getUnusedChangeAddress(addresses?.change);

        const patchedPayload = { ...rest, path, utxo, changeAddress };

        return { method, payload: patchedPayload } as CompatibilityHookResult<M>;
    }

    // Interactive flow of composeTransaction was deprecated in favour of sendTransaction.
    return { method: 'sendTransaction', payload } as CompatibilityHookResult<M>;
};

export const composeTransaction = { compatibilityHook };
