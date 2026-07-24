import type { CallMethodKeys } from '@trezor/connect';

import type { CompatibilityHookParams } from './types';

const compatibilityHook = <M extends CallMethodKeys>({
    method,
    payload,
}: CompatibilityHookParams<M>): CompatibilityHookParams<M> | undefined => {
    if (method === 'composeTransaction') {
        return 'account' in payload && payload.account
            ? { method, payload }
            : // Interactive flow of composeTransaction was deprecated in favour of sendTransaction
              ({ method: 'sendTransaction', payload } as CompatibilityHookParams<M>);
    }
};

export const composeTransaction = { compatibilityHook };
