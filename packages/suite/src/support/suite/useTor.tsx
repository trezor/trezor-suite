import { useEffect } from 'react';

import { desktopApi, BootstrapTorEvent, TorStatusEvent } from '@trezor/suite-desktop-api';
import { TorStatus } from 'src/types/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { getIsTorDomain } from 'src/utils/suite/tor';
import {
    setTorBootstrap,
    setTorBootstrapSlow,
    updateTorStatus,
} from 'src/actions/suite/suiteActions';
import { isWeb, isDesktop, getLocationHostname } from '@trezor/env-utils';
import { selectTorState } from 'src/reducers/suite/suiteReducer';
import { notificationsActions } from '@suite-common/toast-notifications';

export const useTor = () => {
    const { torBootstrap, isTorEnabling } = useSelector(selectTorState);
    const dispatch = useDispatch();

    useEffect(() => {
        if (isWeb()) {
            const isTorDomain = getIsTorDomain(getLocationHostname());
            const newTorStatus = isTorDomain ? TorStatus.Enabled : TorStatus.Disabled;

            dispatch(updateTorStatus(newTorStatus));
        }

        if (isDesktop()) {
            desktopApi.on('tor/status', (newStatus: TorStatusEvent) => {
                const { type } = newStatus;
                dispatch(updateTorStatus(type));
                if (type === TorStatus.Misbehaving) {
                    // When network is slow for some reason but still working we display toast message
                    // to let the user know that it is going to take some time but it's working.
                    dispatch(
                        notificationsActions.addToastOnce({
                            type: 'tor-is-slow',
                        }),
                    );
                }
            });
            if (!isTorEnabling) {
                desktopApi.getTorStatus();
            }

            return () => desktopApi.removeAllListeners('tor/status');
        }
    }, [dispatch, torBootstrap, isTorEnabling]);

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
                    } else if (!isTorEnabling) {
                        dispatch(updateTorStatus(TorStatus.Enabling));
                    }
                }
            });

            return () => desktopApi.removeAllListeners('tor/bootstrap');
        }
    }, [dispatch, torBootstrap, isTorEnabling]);
};
