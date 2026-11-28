import { deviceActions } from '@suite-common/device';
import TrezorConnect, { type CallMethodKeys } from '@trezor/connect';
import { TypedError, serializeError } from '@trezor/connect-common/src/constants/errors';
import { type Dispatch } from '@trezor/redux-utils';
import { err } from '@trezor/type-utils';

import { connectPopupActions } from './connectPopupActions';
import {
    type PendingPopupCall,
    answerPopupCall,
    dropPendingPopupCalls,
    enqueuePopupCall,
    getPendingPopupCall,
} from './connectPopupCallQueue';
import { getPermissionDeferred } from './connectPopupPromiseManager';
import { type ConnectPopupStateRootState, selectConnectPopupCall } from './connectPopupReducer';
import { connectPopupCallInnerThunk } from './connectPopupThunks';
import { type PopupFlowResponse } from './popupFlows/CommonPopupFlow';
import {
    type RequestPopupCall,
    type RequestPopupCallDep,
    type RequestPopupCallParams,
} from './requestPopupCallTypes';

export type RequestPopupCallDeps = {
    dispatch: Dispatch;
    getState: () => ConnectPopupStateRootState;
    /**
     * Set where the user can leave the popup with nothing said to the call it shows (the native
     * popup screen). Such a call is never answered, so there the calls do not wait for each other:
     * the newest one takes the popup over. The calls before it are stopped, and their callers stay
     * without an answer.
     */
    shouldReplacePendingCalls: boolean;
};

const createCancelledResponse = (code: 'Method_Cancel' | 'Method_Interrupted') =>
    err(serializeError(TypedError(code)));

// Stops a running call wherever it is: before the popup, at a user interaction or on the device.
const stopRunningPopupCall = ({ id, abortController }: PendingPopupCall, reason?: string) => {
    abortController.abort(TypedError('Method_Cancel'));
    getPermissionDeferred().reject(TypedError('Method_Cancel'));
    // Always scoped by the id. Without one Connect would abort every call in flight, also the ones
    // Suite makes for itself.
    TrezorConnect.cancel({ reason, callId: id });
};

export const createRequestPopupCall = (deps: RequestPopupCallDeps): RequestPopupCall => {
    const cancelPopupCall = (callId: string, reason: unknown) => {
        const call = getPendingPopupCall(callId);
        if (!call) return;

        if (!call.hasStarted) {
            // Still waiting for its turn: neither the popup nor the device knows about the call.
            answerPopupCall(callId, createCancelledResponse('Method_Cancel'));

            return;
        }

        stopRunningPopupCall(call, typeof reason === 'string' ? reason : undefined);

        // The popup shows the call only after its method info is read. Until then it may still
        // show the call answered before it, which is not the one to close.
        const activeCall = selectConnectPopupCall(deps.getState());
        if (activeCall && 'callId' in activeCall && activeCall.callId === callId) {
            // Clear now instead of when the aborted call settles. No-op before the call reaches a
            // device.
            deps.dispatch(deviceActions.removeButtonRequests({ path: activeCall.devicePath }));
            deps.dispatch(connectPopupActions.finishCall());
        }

        // Answer the caller right away. Otherwise the response depends on TrezorConnect.cancel()
        // propagating through the internal core, interrupting the device, and eventually causing
        // the catch block in connectPopupCallInnerThunk to answer, which may not happen reliably
        // (e.g. the device interrupt doesn't complete, or the Suite popup tab closes before
        // RESPONSE_EVENT is sent).
        answerPopupCall(callId, createCancelledResponse('Method_Interrupted'));
    };

    return <M extends CallMethodKeys>({
        signal,
        ...params
    }: RequestPopupCallParams<M>): Promise<PopupFlowResponse<M>> => {
        // The caller has given up already, there is nothing to start.
        if (signal?.aborted) return Promise.resolve(createCancelledResponse('Method_Cancel'));

        if (deps.shouldReplacePendingCalls) {
            dropPendingPopupCalls().forEach(call => {
                if (call.hasStarted) stopRunningPopupCall(call);
            });
        }

        const { id, response } = enqueuePopupCall(callId => {
            deps.dispatch(connectPopupCallInnerThunk({ ...params, callId }));
        });

        if (signal) {
            const cancel = () => cancelPopupCall(id, signal.reason);
            signal.addEventListener('abort', cancel, { once: true });
            void response.then(() => signal.removeEventListener('abort', cancel));
        }

        // The queue holds the answers of all methods. This one is of the method requested here.
        return response as Promise<PopupFlowResponse<M>>;
    };
};

export const injectRequestPopupCall = (services: any): RequestPopupCallDep => ({
    requestPopupCall: services.requestPopupCall,
});
