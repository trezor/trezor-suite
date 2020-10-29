import { useEffect } from 'react';
import { useActions } from '@suite-hooks';
// import { toTorUrl, isTorDomain } from '@suite-utils/tor';
import * as suiteActions from '@suite-actions/suiteActions';

const Tor = () => {
    /* WIP: For the web implementation
    const isTor = useSelector(state => state.suite.tor);
    useEffect(() => {
        if (process.env.SUITE_TYPE === 'web') {
            updateTorStatus(isTorDomain(window.location.hostname));
        }

        const baseFetch = window.fetch;
        window.fetch = (input: RequestInfo, init?: RequestInit | undefined) => {
            if (isTor && typeof input === 'string') {
                input = toTorUrl(input);
            }

            return baseFetch(input, init);
        };
    }, [isTor, updateTorStatus]);
    */

    const { updateTorStatus } = useActions({
        updateTorStatus: suiteActions.updateTorStatus,
    });

    useEffect(() => {
        if (process.env.SUITE_TYPE === 'desktop') {
            window.desktopApi!.on('tor/status', updateTorStatus);
        }
    }, [updateTorStatus]);

    return null;
};

export default Tor;
