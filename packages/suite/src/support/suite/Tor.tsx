import { useEffect } from 'react';
import { useActions, useSelector } from '@suite-hooks';
import { toTorUrl, isTorDomain } from '@suite-utils/tor';
import * as suiteActions from '@suite-actions/suiteActions';
import { isWeb, isDesktop } from '@suite-utils/env';

const baseFetch = window.fetch;
const torFetch = (input: RequestInfo, init?: RequestInit | undefined) => {
    if (typeof input === 'string') {
        input = toTorUrl(input);
    }
    return baseFetch(input, init);
};

const Tor = () => {
    const isTor = useSelector(state => state.suite.tor);
    useEffect(() => {
        window.fetch = isTor ? torFetch : baseFetch;
    }, [isTor]);

    const { updateTorStatus } = useActions({
        updateTorStatus: suiteActions.updateTorStatus,
    });

    useEffect(() => {
        if (isWeb()) {
            updateTorStatus(isTorDomain(window.location.hostname));
        }

        if (isDesktop()) {
            window.desktopApi!.getStatus();
            window.desktopApi!.on('tor/status', updateTorStatus);
        }
    }, [updateTorStatus]);

    return null;
};

export default Tor;
