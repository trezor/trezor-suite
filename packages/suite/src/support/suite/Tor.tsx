import { useEffect } from 'react';
import { useActions, useSelector } from '@suite-hooks';
import { toTorUrl, isTorDomain } from '@suite-utils/tor';
import * as suiteActions from '@suite-actions/suiteActions';

const Tor = () => {
    const isTor = useSelector(state => state.suite.tor);
    const { updateTorStatus } = useActions({
        updateTorStatus: suiteActions.updateTorStatus,
    });

    useEffect(() => {
        if (process.env.SUITE_TYPE === 'web') {
            const isTor = isTorDomain(window.location.hostname);
            updateTorStatus(isTor);
        }

        if (process.env.SUITE_TYPE === 'desktop') {
            window.desktopApi!.on('tor/status', updateTorStatus);
        }

        const baseFetch = window.fetch;
        window.fetch = (input: RequestInfo, init?: RequestInit | undefined) => {
            if (isTor && typeof input === 'string') {
                input = toTorUrl(input);
            }

            return baseFetch(input, init);
        };
    }, [isTor, updateTorStatus]);

    return null;
};

export default Tor;
