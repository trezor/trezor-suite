import type { CallMethodKeys, CipherKeyValue } from '@trezor/connect';
import { TypedError } from '@trezor/connect-common/src/constants/errors';

import { type PreCallHookParams } from './types';

// Suite derives its labeling secret from a request with this key name (SLIP-0015, see
// ENABLE_LABELING_KEY in suite/metadata), and the device shows such a request as Suite's labeling
// prompt. Requests from other apps with this key name are not passed on.
const SUITE_LABELING_KEY = 'Enable labeling?';

const validateHook = <M extends CallMethodKeys>({
    method,
    payload,
}: Pick<PreCallHookParams<M>, 'method' | 'payload'>) => {
    if (method !== 'cipherKeyValue') return;

    // Same entries as connect-core sends to the device: the bundle, or the payload itself.
    const request = payload as Partial<CipherKeyValue> & { bundle?: CipherKeyValue[] };
    const requests = request.bundle ?? [request];
    // Legacy firmware uses the key name only up to the first NUL character.
    if (requests.some(({ key }) => key?.split('\0')[0] === SUITE_LABELING_KEY)) {
        throw TypedError('Method_NotAllowed');
    }
};

export const cipherKeyValueHooks = { validateHook };
