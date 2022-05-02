import { MODAL } from '@suite-actions/constants';
import { useSelector, useDiscovery } from '@suite-hooks';
import type { Route, ForegroundAppRoute } from '@suite-types';

const isForegroundApp = (route: Route): route is ForegroundAppRoute =>
    !route.isFullscreenApp && !!route.isForegroundApp;

// Firmware, FirmwareCustom, Bridge, Udev, Version - always beats redux modals
// Backup, SwitchDevice - always get beaten by redux modals
// Recovery - beats redux modals with some exceptions (raw-rendered)
const hasPriority = (route: ForegroundAppRoute) => {
    switch (route.app) {
        case 'bridge':
        case 'firmware':
        case 'firmware-custom':
        case 'recovery':
        case 'udev':
        case 'version':
            return true;
        default:
            return false;
    }
};

export const usePreferredModal = () => {
    const { getDiscoveryStatus } = useDiscovery();
    const { route, params, modal } = useSelector(state => ({
        route: state.router.route,
        params: state.router.params,
        modal: state.modal,
    }));

    if (route && isForegroundApp(route) && hasPriority(route)) {
        return {
            type: 'foreground-app',
            payload: {
                app: route.app,
                cancelable: !!(params as any)?.cancelable,
            },
        } as const;
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
        return {
            type: 'foreground-app',
            payload: {
                app: route.app,
                cancelable: !!(params as any)?.cancelable,
            },
        } as const;
    }

    return {
        type: 'none',
    } as const;
};
