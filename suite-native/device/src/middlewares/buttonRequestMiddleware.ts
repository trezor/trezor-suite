import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { UI } from '@trezor/connect';
import { deviceActions, selectDevice } from '@suite-common/wallet-core';
import { isPinAction } from '@suite-native/device-authentication';

export const prepareButtonRequestMiddleware = createMiddlewareWithExtraDeps(
    (action, { dispatch, getState, next }) => {
        next(action);

        if (action.type === UI.REQUEST_PIN) {
            dispatch(
                deviceActions.addButtonRequest({
                    device: selectDevice(getState()),
                    buttonRequest: {
                        code: action.payload.type,
                    },
                }),
            );
        }

        // Pin is not handled by buttonRequest but redux state within @suite-native/device-authentication
        if (action.type === UI.REQUEST_BUTTON && !isPinAction(action)) {
            const { device: _, ...request } = action.payload;

            dispatch(
                deviceActions.addButtonRequest({
                    device: selectDevice(getState()),
                    buttonRequest: request,
                }),
            );
        }

        return action;
    },
);
