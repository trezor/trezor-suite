import { type CallMethodKeys } from '@trezor/connect';

import { type PopupFlowParams, type PopupFlowResponse } from './popupFlows/CommonPopupFlow';

export type RequestPopupCallParams<M extends CallMethodKeys> = Omit<
    PopupFlowParams<M>,
    'callId'
> & {
    /** Abort it to cancel the call. A string given as the abort reason is passed on to Connect. */
    signal?: AbortSignal;
};

/**
 * The only way to start a popup call, for every source. The call waits until the calls requested
 * before it are answered, then it runs. The promise resolves with the answer for the caller and
 * never rejects. A caller reaches only the call it has made: the answer comes through its promise
 * and the cancel through its signal.
 *
 * The answer has the type of the requested method. It is what Connect answered, with no check at
 * run time.
 */
export type RequestPopupCall = <M extends CallMethodKeys>(
    params: RequestPopupCallParams<M>,
) => Promise<PopupFlowResponse<M>>;

export type RequestPopupCallDep = {
    requestPopupCall: RequestPopupCall;
};
