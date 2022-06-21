import { useEffect } from 'react';
import { desktopApi } from '@trezor/suite-desktop-api';
import { useActions, useSelector } from '@suite-hooks';
import { isTorDomain, torFetch, baseFetch } from '@suite-utils/tor';
import * as suiteActions from '@suite-actions/suiteActions';
import { isWeb, isDesktop, getLocationHostname } from '@suite-utils/env';

export const useTor = () => {
    const isTor = useSelector(state => state.suite.tor);

    const { updateTorStatus } = useActions({
        updateTorStatus: suiteActions.updateTorStatus,
    });

    useEffect(() => {
        window.fetch = isTor ? torFetch : baseFetch;
    }, [isTor]);

    useEffect(() => {
        if (isWeb()) {
            updateTorStatus(isTorDomain(getLocationHostname()));
        }

        if (isDesktop()) {
            desktopApi.on('tor/status', updateTorStatus);
            desktopApi.getTorStatus();
        }
    }, [updateTorStatus]);
};
