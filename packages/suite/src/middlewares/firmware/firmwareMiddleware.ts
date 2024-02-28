import { UI } from '@trezor/connect';

import { firmwareActions } from '@suite-common/wallet-core';
import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';

export const prepareFirmwareMiddleware = createMiddlewareWithExtraDeps(
    (action, { getState, dispatch, extra, next }) => {
        const {
            selectors: { selectRouterApp },
            actions: { appChanged },
        } = extra;
        const routerApp = selectRouterApp(getState());

        // pass action
        next(action);

        if (appChanged.match(action)) {
            // leaving firmware update context
            if (['firmware', 'firmware-type', 'onboarding'].includes(routerApp)) {
                dispatch(firmwareActions.resetReducer());
            }
        }

        if (action.type === UI.FIRMWARE_RECONNECT) {
            if (!action.payload.bootloader) {
                dispatch(firmwareActions.setStatus('reconnect-in-normal'));
            } else {
                dispatch(firmwareActions.setStatus('wait-for-reboot'));
            }
            if (action.payload.confirmOnDevice) {
                dispatch(firmwareActions.setStatus('waiting-for-confirmation'));
            }
        }

        if (action.type === UI.FIRMWARE_DISCONNECT) {
            if (action.payload.manual) {
                dispatch(firmwareActions.setStatus('unplug'));
            } else {
                dispatch(firmwareActions.setStatus('waiting-for-bootloader'));
            }
        }
        return action;
    },
);
