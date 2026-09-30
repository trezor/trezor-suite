import { openModal, preserveModal } from '@suite/modal';
import { recoveryActions, selectRecoveryStatus } from '@suite/recovery';
import { type Dispatch } from '@suite-common/redux-utils';
import { type ConnectInitUIEventHooks } from '@suite-common/suite-types';
import { UI_EVENTS, UI_REQUESTS } from '@trezor/connect';

type ConnectInitUIEventHooksDeps = {
    dispatch: Dispatch;
    getState: () => any;
};

export const createConnectInitUIEventHooks = (
    deps: ConnectInitUIEventHooksDeps,
): ConnectInitUIEventHooks => ({
    [UI_EVENTS.PIN_INVALID_ATTEMPTS_DEPLETED]: () => {
        deps.dispatch(openModal({ type: UI_EVENTS.PIN_INVALID_ATTEMPTS_DEPLETED }));
        deps.dispatch(preserveModal());
    },
    [UI_REQUESTS.REQUEST_WORD]: () => {
        if (selectRecoveryStatus(deps.getState()) === 'waiting-for-confirmation') {
            // Since the device asked for a first word, we can safely assume we've received confirmation from the user
            deps.dispatch(recoveryActions.setStatus('in-progress'));
        }
    },
});
