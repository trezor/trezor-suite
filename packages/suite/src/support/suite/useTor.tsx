import { useEffect } from 'react';
import { desktopApi, BootstrapTorEvent, TorStatusEvent } from '@trezor/suite-desktop-api';
import { TorStatus } from '@suite-types';

import { useActions, useSelector } from '@suite-hooks';
import { getIsTorDomain } from '@suite-utils/tor';
import * as suiteActions from '@suite-actions/suiteActions';
import { isWeb, isDesktop, getLocationHostname } from '@trezor/env-utils';
import { selectTorState } from '@suite-reducers/suiteReducer';
import { notificationsActions } from '@suite-common/toast-notifications';

export const useTor = () => {
    const { updateTorStatus, setTorBootstrap, setTorBootstrapSlow, addToastOnce } = useActions({
        updateTorStatus: suiteActions.updateTorStatus,
        setTorBootstrap: suiteActions.setTorBootstrap,
        setTorBootstrapSlow: suiteActions.setTorBootstrapSlow,
        addToastOnce: notificationsActions.addToastOnce,
    });
    const { torBootstrap, isTorEnabling } = useSelector(selectTorState);

    useEffect(() => {
        if (isWeb()) {
            const isTorDomain = getIsTorDomain(getLocationHostname());
            const newTorStatus = isTorDomain ? TorStatus.Enabled : TorStatus.Disabled;

            updateTorStatus(newTorStatus);
        }

        if (isDesktop()) {
            desktopApi.on('tor/status', (newStatus: TorStatusEvent) => {
                const { type } = newStatus;
                updateTorStatus(type);
                if (type === TorStatus.Misbehaving) {
                    // When network is slow for some reason but still working we display toast message
                    // to let the user know that it is going to take some time but it's working.
                    addToastOnce({
                        type: 'tor-is-slow',
                    });
                }
            });
            if (!isTorEnabling) {
                desktopApi.getTorStatus();
            }
            return () => desktopApi.removeAllListeners('tor/status');
        }
    }, [updateTorStatus, torBootstrap, addToastOnce, isTorEnabling]);

    useEffect(() => {
        if (isDesktop()) {
            desktopApi.on('tor/bootstrap', (bootstrapEvent: BootstrapTorEvent) => {
                if (bootstrapEvent.type === 'slow') {
                    setTorBootstrapSlow(true);
                }

                if (bootstrapEvent.type === 'progress') {
                    setTorBootstrap({
                        current: bootstrapEvent.progress.current,
                        total: bootstrapEvent.progress.total,
                    });

                    if (bootstrapEvent.progress.current === bootstrapEvent.progress.total) {
                        updateTorStatus(TorStatus.Enabled);
                    } else if (!isTorEnabling) {
                        updateTorStatus(TorStatus.Enabling);
                    }
                }
            });

            return () => desktopApi.removeAllListeners('tor/bootstrap');
        }
    }, [updateTorStatus, setTorBootstrap, torBootstrap, setTorBootstrapSlow, isTorEnabling]);
};
