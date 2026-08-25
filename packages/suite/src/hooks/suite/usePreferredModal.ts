import { MODAL_CONTEXT_NONE } from '@suite/modal';
import {
    type ModalAppParams,
    type RouterAppWithParams,
    selectForegroundAppParams,
    selectIsForegroundApp,
    selectIsFullscreenApp,
    selectRouterApp,
} from '@suite/router';

import { useSelector } from 'src/hooks/suite';
import type { ForegroundAppRoute } from 'src/types/suite';

const HAS_PRIORITY_OVER_REDUX_MODAL: Record<ForegroundAppRoute['app'], boolean> = {
    // Firmware, FirmwareCustom, Bridge, Udev, Version, Create New Multi-share Backup - always beats redux modals
    firmware: true,
    'firmware-type': true,
    'firmware-custom': true,
    bridge: true,
    'bridge-requested': true,
    'bridge-deprecated': true,
    udev: true,
    version: true,
    'create-multi-share-backup': true,
    'create-wallet-backup': true,

    // Recovery - beats redux modals with some exceptions (raw-rendered)
    recovery: true,

    // Backup, SwitchDevice - always get beaten by redux modals
    'switch-device': false,
    backup: false,
};

const isForegroundApp = (app: RouterAppWithParams['app']): app is ForegroundAppRoute['app'] =>
    app in HAS_PRIORITY_OVER_REDUX_MODAL;

const getForegroundAppAction = (app: ForegroundAppRoute['app'], params: Partial<ModalAppParams>) =>
    ({
        type: 'foreground-app',
        payload: {
            ...params,
            app,
            // params are undefined when the user goes directly to the URL
            cancelable: !!params?.cancelable,
        },
    }) as const;

export const usePreferredModal = () => {
    // Only the flags the decision needs, so that navigating between regular routes does not
    // re-render every consumer of this hook.
    const routerApp = useSelector(selectRouterApp);
    const isForegroundAppRoute = useSelector(selectIsForegroundApp);
    const isFullscreenAppRoute = useSelector(selectIsFullscreenApp);
    const params = useSelector(selectForegroundAppParams) as Partial<ModalAppParams>;
    const modal = useSelector(state => state.modal);

    const foregroundApp =
        isForegroundAppRoute && !isFullscreenAppRoute && isForegroundApp(routerApp)
            ? routerApp
            : undefined;

    if (foregroundApp !== undefined && HAS_PRIORITY_OVER_REDUX_MODAL[foregroundApp]) {
        return getForegroundAppAction(foregroundApp, params);
    }

    if (modal.context !== MODAL_CONTEXT_NONE) {
        return {
            type: 'redux-modal',
            payload: modal,
        } as const;
    }

    if (foregroundApp !== undefined) {
        return getForegroundAppAction(foregroundApp, params);
    }

    return {
        type: 'none',
    } as const;
};
