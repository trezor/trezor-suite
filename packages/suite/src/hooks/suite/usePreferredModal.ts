import { Route } from '@suite-common/suite-types';
import { UI } from '@trezor/connect';

import { MODAL } from 'src/actions/suite/constants';
import { useDiscovery, useSelector } from 'src/hooks/suite';
import type { ForegroundAppRoute } from 'src/types/suite';
import { ModalAppParams } from 'src/utils/suite/router';
import { selectDiscoveryOverallStatus } from 'src/utils/wallet/selectDiscoveryOverallStatus';

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
            app: route.app,
            // params are undefined when the user goes directly to the URL
            cancelable: !!params?.cancelable,
        },
    }) as const;

export const usePreferredModal = () => {
    const { discovery: discoveryForSelectedDevice } = useDiscovery();
    const discoveryStatus = useSelector(selectDiscoveryOverallStatus);
    const route = useSelector(state => state.router.route);
    const params = useSelector(state => state.router.params as Partial<ModalAppParams>);
    const modal = useSelector(state => state.modal);
    const isPassphraseFlow =
        Boolean(discoveryForSelectedDevice?.isAddingHiddenWallet) &&
        discoveryForSelectedDevice?.status !== 'cancelled' &&
        discoveryForSelectedDevice?.status !== 'complete' &&
        discoveryForSelectedDevice?.status !== 'failed';

    if (route && isForegroundApp(route) && hasPriority(route)) {
        return getForegroundAppAction(route, params);
    }

    if (modal.context !== MODAL.CONTEXT_NONE) {
        // NOTE: in case when passphrase flow is active, we handle the device passphrase request
        // within the passphrase flow
        if (
            'windowType' in modal &&
            modal.windowType === UI.REQUEST_PASSPHRASE &&
            isPassphraseFlow &&
            discoveryForSelectedDevice
        ) {
            return {
                type: 'passphrase-flow',
            } as const;
        }

        if ('windowType' in modal && modal.windowType === UI.REQUEST_PASSPHRASE) {
            return {
                type: 'device-request-passphrase',
                payload: modal,
            } as const;
        }

        return {
            type: 'redux-modal',
            payload: modal,
        } as const;
    }

    if (isPassphraseFlow && discoveryForSelectedDevice) {
        return {
            type: 'passphrase-flow',
        } as const;
    }

    // account discovery in progress and didn't find any used account yet.
    // display Loader wrapped in modal above requested route to keep "modal" flow continuity.
    // or display "Action modal" (like: pin/passphrase request)
    if (discoveryStatus?.type === 'auth-confirm') {
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
