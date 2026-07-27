import { useEffect, useMemo } from 'react';

import { TorStatus, getIsTorDomain, selectTorState } from '@suite/tor';
import { useServices } from '@suite-common/dependency-injection';
import {
    selectDisconnectAllRelaysDep,
    selectReconnectAllRelaysDep,
} from '@suite-common/suite-sync-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { getLocationHostname, isDesktop, isWeb } from '@trezor/env-utils';
import { type BootstrapTorEvent, type TorStatusEvent, desktopApi } from '@trezor/suite-desktop-api';

import {
    setTorBootstrap,
    setTorBootstrapSlow,
    updateTorStatus,
} from 'src/actions/suite/suiteActions';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { useTorReconnectionLifecycle } from './useTorReconnectionLifecycle';

export const useTor = () => {
    const { torBootstrap, isTorEnabling } = useSelector(selectTorState);
    const { reconnectAllRelays, disconnectAllRelays } = useServices(
        selectReconnectAllRelaysDep,
        selectDisconnectAllRelaysDep,
    );
    const dispatch = useDispatch();

    // IMPORTANT: This is the place to register all services
    //            that need to disconnect/reconnect when
    //            Tor is changing the state.
    const torReconnectionLifecycleParams = useMemo(
        () => ({
            reconnect: reconnectAllRelays,
            disconnect: disconnectAllRelays,
        }),
        [disconnectAllRelays, reconnectAllRelays],
    );

    const handleTorReconnection = useTorReconnectionLifecycle(torReconnectionLifecycleParams);

    useEffect(() => {
        if (isWeb()) {
            const isTorDomain = getIsTorDomain(getLocationHostname());
            const newTorStatus = isTorDomain ? TorStatus.Enabled : TorStatus.Disabled;

            dispatch(updateTorStatus(newTorStatus));
            handleTorReconnection({ status: newTorStatus });
        }

        if (isDesktop()) {
            desktopApi.on('tor/status', (newStatus: TorStatusEvent) => {
                const { type } = newStatus;
                dispatch(updateTorStatus(type));
                handleTorReconnection({ status: type });

                if (type === TorStatus.Slow) {
                    dispatch(notificationsActions.addToastOnce({ type: 'tor-is-slow' }));
                }
            });

            if (!isTorEnabling) {
                desktopApi.getTorStatus();
            }

            return () => desktopApi.removeAllListeners('tor/status');
        }
    }, [dispatch, handleTorReconnection, torBootstrap, isTorEnabling]);

    useEffect(() => {
        if (isDesktop()) {
            desktopApi.on('tor/bootstrap', (bootstrapEvent: BootstrapTorEvent) => {
                if (bootstrapEvent.type === 'slow') {
                    dispatch(setTorBootstrapSlow(true));
                }

                if (bootstrapEvent.type === 'progress') {
                    dispatch(
                        setTorBootstrap({
                            current: bootstrapEvent.progress.current,
                            total: bootstrapEvent.progress.total,
                        }),
                    );

                    if (bootstrapEvent.progress.current === bootstrapEvent.progress.total) {
                        dispatch(updateTorStatus(TorStatus.Enabled));
                        handleTorReconnection({ status: TorStatus.Enabled });
                    } else {
                        if (!isTorEnabling) {
                            dispatch(updateTorStatus(TorStatus.Enabling));
                        }

                        handleTorReconnection({ status: TorStatus.Enabling });
                    }
                }
            });

            return () => desktopApi.removeAllListeners('tor/bootstrap');
        }
    }, [dispatch, handleTorReconnection, torBootstrap, isTorEnabling]);
};
