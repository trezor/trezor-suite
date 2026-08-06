import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import {
    type TorRootState,
    TorStatus,
    selectIsTorEnabling,
    selectTorBootstrap,
    torActions,
} from '@suite/tor';
import { type NotificationsRootState, addToastOnceThunk } from '@suite-common/toast-notifications';
import { isDesktop } from '@trezor/env-utils';
import { type BootstrapTorEvent, type TorStatusEvent, desktopApi } from '@trezor/suite-desktop-api';

import { setTorBootstrapSlowThunk } from './bootstrap/setTorBootstrapSlowThunk';
import { setTorBootstrapThunk } from './bootstrap/setTorBootstrapThunk';

type DesktopTorRootState = TorRootState & NotificationsRootState;

type DesktopTorDispatch = ThunkDispatch<DesktopTorRootState, Record<never, never>, UnknownAction>;

type UseDesktopTorStatusParams = {
    onStatusChange: (params: { status: TorStatus }) => void;
};

// On desktop the Tor daemon is controlled locally; status and bootstrap progress
// arrive as events from the desktop process via `desktopApi`.
export const useDesktopTorStatus = ({ onStatusChange }: UseDesktopTorStatusParams) => {
    const dispatch = useDispatch<DesktopTorDispatch>();
    const torBootstrap = useSelector(selectTorBootstrap);
    const isTorEnabling = useSelector(selectIsTorEnabling);

    useEffect(() => {
        if (!isDesktop()) {
            return;
        }

        desktopApi.on('tor/status', (newStatus: TorStatusEvent) => {
            const { type } = newStatus;
            dispatch(torActions.setTorStatus(type));
            onStatusChange({ status: type });

            if (type === TorStatus.Slow) {
                dispatch(addToastOnceThunk({ type: 'tor-is-slow' }));
            }
        });

        if (!isTorEnabling) {
            desktopApi.getTorStatus();
        }

        return () => desktopApi.removeAllListeners('tor/status');
    }, [dispatch, onStatusChange, torBootstrap, isTorEnabling]);

    useEffect(() => {
        if (!isDesktop()) {
            return;
        }

        desktopApi.on('tor/bootstrap', (bootstrapEvent: BootstrapTorEvent) => {
            if (bootstrapEvent.type === 'slow') {
                dispatch(setTorBootstrapSlowThunk(true));
            }

            if (bootstrapEvent.type === 'progress') {
                dispatch(
                    setTorBootstrapThunk({
                        current: bootstrapEvent.progress.current,
                        total: bootstrapEvent.progress.total,
                    }),
                );

                if (bootstrapEvent.progress.current === bootstrapEvent.progress.total) {
                    dispatch(torActions.setTorStatus(TorStatus.Enabled));
                    onStatusChange({ status: TorStatus.Enabled });
                } else {
                    if (!isTorEnabling) {
                        dispatch(torActions.setTorStatus(TorStatus.Enabling));
                    }

                    onStatusChange({ status: TorStatus.Enabling });
                }
            }
        });

        return () => desktopApi.removeAllListeners('tor/bootstrap');
    }, [dispatch, onStatusChange, torBootstrap, isTorEnabling]);
};
