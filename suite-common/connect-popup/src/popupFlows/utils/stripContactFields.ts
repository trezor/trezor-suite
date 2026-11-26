import type { CallMethodKeys } from '@trezor/connect';

import { type PopupFlowParams, type PopupFlowPayload } from '../CommonPopupFlow';

type SignTransactionOutput = PopupFlowPayload<'signTransaction'>['outputs'][number];

const isObject = (value: unknown): value is object => typeof value === 'object' && value !== null;

const withoutContactFields = (output: SignTransactionOutput): SignTransactionOutput => {
    if (!isObject(output)) return output;

    const stripped = { ...output };
    delete stripped.contact_pubkey;
    delete stripped.contact_signature;

    return stripped;
};

/**
 * Contact fields on signTransaction outputs are Suite's own: with them, Connect syncs wardd before
 * signing, which takes one of the device's persistent WARD sessions. A host app's call goes on
 * without them, so its outputs are signed as bare addresses.
 */
export const stripContactFields = (
    params: PopupFlowParams<CallMethodKeys>,
): PopupFlowParams<CallMethodKeys> => {
    if (params.method !== 'signTransaction') return params;

    // Payloads are untrusted: an invalid one is left unchanged for Connect to reject.
    const payload = params.payload as PopupFlowPayload<'signTransaction'>;
    if (!isObject(payload) || !Array.isArray(payload.outputs)) return params;

    return {
        ...params,
        payload: { ...payload, outputs: payload.outputs.map(withoutContactFields) },
    };
};
