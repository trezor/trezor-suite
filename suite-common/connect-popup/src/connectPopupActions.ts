import { createAction } from '@reduxjs/toolkit';

import { ConnectPopupCall } from './connectPopupTypes';

export const ACTION_PREFIX = '@suite-common/connect-popup';

const initiateCall = createAction(`${ACTION_PREFIX}/initiateCall`, (payload: ConnectPopupCall) => ({
    payload,
}));

const approveCall = createAction(`${ACTION_PREFIX}/approveCall`);

const finishCall = createAction(`${ACTION_PREFIX}/finishCall`);

const rejectCall = createAction(`${ACTION_PREFIX}/rejectCall`, (payload: Error) => ({
    payload,
}));

export const connectPopupActions = {
    initiateCall,
    approveCall,
    finishCall,
    rejectCall,
} as const;
