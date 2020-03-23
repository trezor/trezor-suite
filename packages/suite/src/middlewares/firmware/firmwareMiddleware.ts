import { MiddlewareAPI } from 'redux';
import { DEVICE } from 'trezor-connect';
import { SUITE } from '@suite-actions/constants';
import * as firmwareActions from '@firmware-actions/firmwareActions';
import { AppState, Action, Dispatch } from '@suite-types';

const firmware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    const prevApp = api.getState().router.app;

    // pass action
    next(action);

    const { status } = api.getState().firmware;

    switch (action.type) {
        case DEVICE.DISCONNECT:
            // if current status is error, reset to initial status on device disconnect
            if (status === 'error' || status === 'done') {
                api.dispatch(firmwareActions.resetReducer());
                break;
            }
            // when device disconnects and it is not in bootloader, save its target
            // firmwareRelease for future use. note that we do not save firmwareRelease
            // in bootloader, which also means that we do not save it when no firmware is installed
            // but in this case we may safely fallback to firmwareRelease of currently connected device
            if (action.payload.features && action.payload.mode !== 'bootloader') {
                api.dispatch(firmwareActions.setTargetRelease(action.payload.firmwareRelease));
            }

            break;
        case SUITE.SELECT_DEVICE:
            if (
                action.payload &&
                action.payload.features &&
                ['unplug', 'wait-for-reboot'].includes(status) &&
                action.payload
            ) {
                if (action.payload.firmware === 'valid') {
                    api.dispatch(firmwareActions.setStatus('done'));
                } else if (['outdated', 'required'].includes(action.payload.firmware)) {
                    api.dispatch(firmwareActions.setStatus('partially-done'));
                }
            }
            break;
        case SUITE.APP_CHANGED:
            if (prevApp === 'firmware' || prevApp === 'onboarding') {
                api.dispatch(firmwareActions.resetReducer());
            }
            break;
        default:
    }

    return action;
};
export default firmware;
