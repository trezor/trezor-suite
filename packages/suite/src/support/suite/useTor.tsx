import { useEffect } from 'react';
import { desktopApi, BootstrapTorEvent, TorStatusEvent } from '@trezor/suite-desktop-api';
import { useActions, useSelector } from '@suite-hooks';
import { getIsTorDomain } from '@suite-utils/tor';
import * as suiteActions from '@suite-actions/suiteActions';
import { isWeb, isDesktop } from '@suite-utils/env';
import { getLocationHostname } from '@trezor/env-utils';
import { TorStatus } from '@suite-types';
import { selectTorState } from '@suite-reducers/suiteReducer';
import { notificationsActions } from '@suite-common/toast-notifications';

export const useTor = () => {
    const { updateTorStatus, setTorBootstrap, setTorBootstrapSlow, addToast } = useActions({
        updateTorStatus: suiteActions.updateTorStatus,
        setTorBootstrap: suiteActions.setTorBootstrap,
        setTorBootstrapSlow: suiteActions.setTorBootstrapSlow,
        addToast: notificationsActions.addToast,
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
                switch (type) {
                    case 'Bootstrapping':
                        updateTorStatus(TorStatus.Enabling);
                        break;
                    case 'Enabled':
                        updateTorStatus(TorStatus.Enabled);
                        break;
                    case 'Disabling':
                        updateTorStatus(TorStatus.Disabling);
                        break;
                    case 'Disabled':
                        updateTorStatus(TorStatus.Disabled);
                        break;
                    case 'Misbehaving':
                        // When network is slow for some reason but still working we display toast message
                        // to let the user know that it is going to take some time but it's working.
                        addToast({
                            type: 'tor-is-slow',
                        });
                        break;
                    default:
                        updateTorStatus(TorStatus.Error);
                }
            });
        }

        return () => desktopApi.removeAllListeners('tor/status');
    }, [updateTorStatus, torBootstrap, addToast]);

    useEffect(() => {
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
    }, [updateTorStatus, setTorBootstrap, torBootstrap, setTorBootstrapSlow, isTorEnabling]);
};
