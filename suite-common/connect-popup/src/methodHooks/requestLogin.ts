import type { CallMethodKeys } from '@trezor/connect';

import { type PreCallHookParams } from './types';

const preCallHook = <M extends CallMethodKeys>({
    method,
    payload,
    source,
}: PreCallHookParams<M>) => {
    if (method === 'requestLogin') {
        return {
            ...payload,
            origin: source.origin,
        };
    }
};

export const requestLoginHooks = {
    preCallHook,
};
