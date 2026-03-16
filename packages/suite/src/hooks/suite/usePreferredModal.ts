import { MODAL_CONTEXT_NONE } from '@suite/modal';
import { type ModalAppParams, selectRoute, selectRouterParams } from '@suite/router';
import { selectConnectPopupCall } from '@suite-common/connect-popup';
import { type Route } from '@suite-common/suite-types';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { UI_REQUEST } from '@trezor/connect';

import { useDiscovery, useSelector } from 'src/hooks/suite';
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
    const { discovery: discoveryForSelectedDevice } = useDiscovery();
    const route = useSelector(selectRoute);
    const params = useSelector(selectRouterParams) as Partial<ModalAppParams>;
    const modal = useSelector(state => state.modal);
    const discoveryInProgress = useSelector(selectHasRunningDiscovery);
    const isPassphraseFlow =
        Boolean(discoveryForSelectedDevice?.isAddingHiddenWallet) &&
        discoveryInProgress &&
        !(
            discoveryForSelectedDevice?.status === 'progress' &&
            discoveryForSelectedDevice.hasLoadedAnyNonEmptyAccount
        );
    const isConnectPopupFlow = useSelector(
        state => selectConnectPopupCall(state)?.state === 'call-error',
    );

    if (route && isForegroundApp(route) && hasPriority(route)) {
        return getForegroundAppAction(route, params);
    }

    if (modal.context !== MODAL_CONTEXT_NONE) {
        // NOTE: in case when passphrase flow is active, we handle the device passphrase request
        // within the passphrase flow
        const windowType = 'windowType' in modal ? modal.windowType : undefined;
        if (windowType === UI_REQUEST.REQUEST_PASSPHRASE) {
            if (isPassphraseFlow && discoveryForSelectedDevice) {
                return {
                    type: 'passphrase-flow',
                } as const;
            }

            return {
                type: 'device-request-passphrase',
                payload: modal,
            } as const;
        }

        // edge case for connect popup, since it itself is a modal, but we can enter passphrase flow from there
        if (isPassphraseFlow && discoveryForSelectedDevice && isConnectPopupFlow) {
            return {
                type: 'passphrase-flow',
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

    if (route && isForegroundApp(route)) {
        return getForegroundAppAction(route, params);
    }

    return {
        type: 'none',
    } as const;
};
