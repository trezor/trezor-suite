import { type CallMethodKeys } from '@trezor/connect';
import { type Dispatch } from '@trezor/redux-utils';

import { getPopupCallDeferred } from './connectPopupPromiseManager';
import { connectPopupCallThunk } from './connectPopupThunks';
import { type PopupFlowAnswer, type PopupFlowParams } from './popupFlows/CommonPopupFlow';

export type CallConnectPopupDeps = {
    dispatch: Dispatch;
};

export type CallConnectPopup = <M extends CallMethodKeys>(
    params: PopupFlowParams<M>,
) => Promise<PopupFlowAnswer>;

export type CallConnectPopupDep = {
    callConnectPopup: CallConnectPopup;
};

export const createCallConnectPopup =
    (deps: CallConnectPopupDeps): CallConnectPopup =>
    params => {
        deps.dispatch(connectPopupCallThunk(params));

        return getPopupCallDeferred(true).promise;
    };
