import { useEffect } from 'react';
import { desktopApi } from '@trezor/suite-desktop-api';
import { useActions, useSelector } from '@suite-hooks';
import { baseFetch, getIsTorDomain, torFetch } from '@suite-utils/tor';
import * as suiteActions from '@suite-actions/suiteActions';
import { isWeb, isDesktop } from '@suite-utils/env';
import { getLocationHostname } from '@trezor/env-utils';
import { TorStatus } from '@suite-types';
import { selectTorState } from '@suite-reducers/suiteReducer';

export const useTor = () => {
    const { isTorEnabled } = useSelector(selectTorState);

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
