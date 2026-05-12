import { deviceActions, selectSelectedDevice } from '@suite-common/device';
import { UI_REQUEST } from '@trezor/connect';

import { type ConnectInitHooks } from './types';

type AnyDispatch = (action: any) => any;
type GetState = () => Parameters<typeof selectSelectedDevice>[0];

type HandleConnectUiActionDeps = {
    dispatch: AnyDispatch;
    getState: GetState;
    // Accepts `void` so the thunk's `ConnectInitHooks | void` arg can be
    // passed straight through without normalisation at every call site.
    connectInitHooks?: ConnectInitHooks | void;
};

type AnyConnectUiAction = {
    type: string;
    payload?: any;
};

/**
 * Side effects for a single TrezorConnect UI event, factored out of
 * `connectInitThunks` so the same handling runs from:
 *
 *  - the global `UI_EVENT` listener installed at boot (for non-scoped
 *    calls, which still drive the redux modal stack)
 *  - the per-call default handler in `useConnect` (for scoped calls that
 *    fall through to the default — e.g. `start` / `handleDefault`)
 *
 * Keeps the two paths in sync. Manual-mode scoped flows that opt out of
 * the default handler (e.g. the gallery iterating `proc.run()` itself)
 * skip this entirely.
 */
export const handleConnectUiAction = (
    action: AnyConnectUiAction,
    deps: HandleConnectUiActionDeps,
) => {
    const { dispatch, getState, connectInitHooks } = deps;

    if (action.type === UI_REQUEST.FIRMWARE_DOWNLOADED) {
        // We are in web therefore we ignore `FIRMWARE_DOWNLOADED` action.
        return;
    }

    // dispatch event as action
    dispatch(action);

    // this switch is still one more layer of indirection to be removed.
    // connect actions are dispatched and could be handled directly in reducers
    switch (action.type) {
        case UI_REQUEST.REQUEST_PIN:
        case UI_REQUEST.INVALID_PIN:
            dispatch(
                deviceActions.addButtonRequest({
                    // todo: note that this is not 'threadsafe', currently selected device is not necessarily the device
                    // connect call was made for
                    device: selectSelectedDevice(getState()),
                    buttonRequest: {
                        code: action.payload.type ? action.payload.type : action.type,
                    },
                }),
            );
            break;
        case UI_REQUEST.REQUEST_BUTTON: {
            const { device: _, ...request } = action.payload;
            dispatch(
                deviceActions.addButtonRequest({
                    device: selectSelectedDevice(getState()),
                    buttonRequest: request,
                }),
            );
            break;
        }
    }

    if (
        connectInitHooks &&
        (action.type === UI_REQUEST.INVALID_PIN_ATTEMPTS_DEPLETED ||
            action.type === UI_REQUEST.REQUEST_WORD)
    ) {
        connectInitHooks[action.type]?.();
    }
};
