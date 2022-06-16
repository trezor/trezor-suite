import { useEffect } from 'react';
import { desktopApi } from '@trezor/suite-desktop-api';
import { useActions, useSelector } from '@suite-hooks';
import { toTorUrl, isTorDomain } from '@suite-utils/tor';
import * as suiteActions from '@suite-actions/suiteActions';
import { isWeb, isDesktop, getLocationHostname } from '@suite-utils/env';

const baseFetch = window.fetch;

const torFetch = (input: RequestInfo, init?: RequestInit | undefined) => {
    if (typeof input === 'string') {
        input = toTorUrl(input);
    }

    return baseFetch(input, init);
};

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
            desktopApi.getTorStatus();
            desktopApi.on('tor/status', updateTorStatus);
        }
    }, [updateTorStatus]);
};
