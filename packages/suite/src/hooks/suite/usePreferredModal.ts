import { MODAL_CONTEXT_NONE } from '@suite/modal';
import { type ModalAppParams, type Route, selectRoute, selectRouterParams } from '@suite/router';

import { useSelector } from 'src/hooks/suite';
import type { ForegroundAppRoute } from 'src/types/suite';

const isForegroundApp = (route: Route): route is ForegroundAppRoute =>
    !route.isFullscreenApp && !!route.isForegroundApp;

const hasPriority = (route: ForegroundAppRoute) => {
    const map: Record<ForegroundAppRoute['app'], boolean> = {
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

        // Recovery - beats redux modals with some exceptions (raw-rendered)
        recovery: true,

        // Backup, SwitchDevice - always get beaten by redux modals
        'switch-device': false,
        backup: false,
    };

    return map[route.app];
};

const getForegroundAppAction = (route: ForegroundAppRoute, params: Partial<ModalAppParams>) =>
    ({
        type: 'foreground-app',
        payload: {
            ...params,
            app: route.app,
            // params are undefined when the user goes directly to the URL
            cancelable: !!params?.cancelable,
        },
    }) as const;

export const usePreferredModal = () => {
    const route = useSelector(selectRoute);
    const params = useSelector(selectRouterParams) as Partial<ModalAppParams>;
    const modal = useSelector(state => state.modal);

    if (route && isForegroundApp(route) && hasPriority(route)) {
        return getForegroundAppAction(route, params);
    }

    if (modal.context !== MODAL_CONTEXT_NONE) {
        return {
            type: 'redux-modal',
            payload: modal,
        } as const;
    }

    if (route && isForegroundApp(route)) {
        return getForegroundAppAction(route, params);
    }

    return {
        type: 'none',
    } as const;
};
