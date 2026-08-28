import { type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { type ModalRootState, openDeferredModal, selectModalType } from '@suite/modal';
import { type RouterRootState, selectRouterUrl } from '@suite/router';
import { type TorRootState, isOnionUrl, selectTorBootstrap, torActions } from '@suite/tor';
import { TorStatus } from '@suite/tor-types';
import { type WithServices } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type BlockchainRootState, selectBlockchainState } from '@suite-common/wallet-core';
import { getCustomBackends } from '@suite-common/wallet-utils';
import { desktopApi } from '@trezor/suite-desktop-api';

type ToggleTorThunkState = TorRootState & ModalRootState & RouterRootState & BlockchainRootState;

type ToggleTorThunkDeps = WithServices<DesktopAnalyticsDep>;

export type ToggleTorDispatch = ThunkDispatch<
    ToggleTorThunkState,
    ToggleTorThunkDeps,
    UnknownAction
>;

export const toggleTor =
    (shouldEnable: boolean) =>
    async (
        dispatch: ToggleTorDispatch,
        getState: () => ToggleTorThunkState,
        extra: ToggleTorThunkDeps,
    ) => {
        const modal = selectModalType(getState());
        const torBootstrap = selectTorBootstrap(getState());

        const backends = getCustomBackends(selectBlockchainState(getState()));

        // Is there any network with only onion custom backends?
        const hasSomeOnionBackends = backends.some(
            ({ urls }) => urls.length && urls.every(isOnionUrl),
        );

        if (!shouldEnable && hasSomeOnionBackends) {
            const res = await dispatch(openDeferredModal({ type: 'disable-tor' }));
            if (!res) return;
        }

        if (shouldEnable && torBootstrap) {
            // Reset Tor Bootstrap before starting it.
            dispatch(torActions.setTorBootstrap(null));
        }

        if (shouldEnable) {
            // Updating here TorStatus to Enabling so user gets faster feedback that something is happening
            // instead of wait for the event coming from request-manager in useTor.
            dispatch(torActions.setTorStatus(TorStatus.Enabling));
        }

        const ipcResponse = await desktopApi.toggleTor(shouldEnable);

        if (ipcResponse.success) {
            extra.services.analytics.report({
                type: events.settingsTorEvent.name,
                payload: {
                    value: shouldEnable,
                    location: selectRouterUrl(getState()),
                    modal,
                },
            });
        }

        if (!ipcResponse.success && ipcResponse.error) {
            dispatch(
                notificationsActions.addToast({
                    type: 'tor-toggle-error',
                    error: ipcResponse.error,
                }),
            );

            return Promise.reject();
        }
    };
