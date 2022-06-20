import { useEffect } from 'react';
import { desktopApi } from '@trezor/suite-desktop-api';
import { useActions, useSelector } from '@suite-hooks';
import {
    baseFetch,
    getIsTorEnabled,
    isTorDomain as getIsTorDomain,
    torFetch,
} from '@suite-utils/tor';
import * as suiteActions from '@suite-actions/suiteActions';
import { isWeb, isDesktop, getLocationHostname } from '@suite-utils/env';
import { TorStatus } from '@suite-reducers/suiteReducer';

export const useTor = () => {
    const isTorEnabled = useSelector(state => getIsTorEnabled(state.suite.torStatus));

    const { updateTorStatus } = useActions({
        updateTorStatus: suiteActions.updateTorStatus,
    });

    useEffect(() => {
        window.fetch = isTorEnabled ? torFetch : baseFetch;
    }, [isTorEnabled]);

    useEffect(() => {
        if (isWeb()) {
            const isTorDomain = getIsTorDomain(getLocationHostname());
            const newTorStatus = isTorDomain ? TorStatus.Enabled : TorStatus.Disabled;

            updateTorStatus(newTorStatus);
        }

        if (isDesktop()) {
            desktopApi.on('tor/status', (newStatus: boolean) =>
                updateTorStatus(newStatus ? TorStatus.Enabled : TorStatus.Disabled),
            );
            desktopApi.getTorStatus();
        }
    }, [updateTorStatus]);
};
