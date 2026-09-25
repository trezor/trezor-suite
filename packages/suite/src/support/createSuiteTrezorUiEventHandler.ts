import { openModal, preserveModal } from '@suite/modal';
import { recoveryActions, selectRecoveryStatus } from '@suite/recovery';
import { type Dispatch } from '@suite-common/redux-utils';
import { type TrezorUiEventHandler } from '@suite-common/suite-types';
import { defaultTrezorUIEventHandlerThunk } from '@suite-common/wallet-core';
import { UI_EVENTS, UI_REQUESTS } from '@trezor/connect';

type SuiteTrezorUiEventHandlerDeps = {
    dispatch: Dispatch;
    getState: () => any;
};

export const createSuiteTrezorUiEventHandler =
    (deps: SuiteTrezorUiEventHandlerDeps): TrezorUiEventHandler =>
    action => {
        deps.dispatch(defaultTrezorUIEventHandlerThunk(action));

        switch (action.type) {
            case UI_EVENTS.PIN_INVALID_ATTEMPTS_DEPLETED:
                deps.dispatch(openModal({ type: UI_EVENTS.PIN_INVALID_ATTEMPTS_DEPLETED }));
                deps.dispatch(preserveModal());
                break;
            case UI_REQUESTS.REQUEST_WORD:
                if (selectRecoveryStatus(deps.getState()) === 'waiting-for-confirmation') {
                    // Since the device asked for a first word, we can safely assume we've received confirmation from the user
                    deps.dispatch(recoveryActions.setStatus('in-progress'));
                }
                break;
        }
    };
