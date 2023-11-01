import { Route } from '@suite-common/suite-types';

import { MODAL } from 'src/actions/suite/constants';
import { useSelector, useDiscovery } from 'src/hooks/suite';
import type { ForegroundAppRoute } from 'src/types/suite';
import { ModalAppParams } from 'src/utils/suite/router';

const isForegroundApp = (route: Route): route is ForegroundAppRoute =>
    !route.isFullscreenApp && !!route.isForegroundApp;

// Firmware, FirmwareCustom, Bridge, Udev, Version - always beats redux modals
// Backup, SwitchDevice - always get beaten by redux modals
// Recovery - beats redux modals with some exceptions (raw-rendered)
const hasPriority = (route: ForegroundAppRoute) => {
    switch (route.app) {
        case 'bridge':
        case 'firmware':
        case 'firmware-type':
        case 'firmware-custom':
        case 'recovery':
        case 'udev':
        case 'version':
            return true;
        default:
            return false;
    }
};

const getForegroundAppAction = (route: ForegroundAppRoute, params: Partial<ModalAppParams>) =>
    ({
        type: 'foreground-app',
        payload: {
            app: route.app,
            // params are undefined when the user goes directly to the URL
            cancelable: !!params?.cancelable,
        },
    }) as const;

export const usePreferredModal = () => {
    const { getDiscoveryStatus } = useDiscovery();
    const route = useSelector(state => state.router.route);
    const params = useSelector(state => state.router.params as Partial<ModalAppParams>);
    const modal = useSelector(state => state.modal);

    if (route && isForegroundApp(route) && hasPriority(route)) {
        return getForegroundAppAction(route, params);
    }

    if (modal.context !== MODAL.CONTEXT_NONE) {
        return {
            type: 'redux-modal',
            payload: modal,
        } as const;
    }

    // account discovery in progress and didn't find any used account yet.
    // display Loader wrapped in modal above requested route to keep "modal" flow continuity.
    // or display "Action modal" (like: pin/passphrase request)
    if (getDiscoveryStatus()?.type === 'auth-confirm') {
        return {
            type: 'discovery-loading',
        } as const;
    }

    if (route && isForegroundApp(route)) {
        return getForegroundAppAction(route, params);
    }

    return {
        type: 'none',
    } as const;
};
