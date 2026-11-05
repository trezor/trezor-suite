import { PollingController } from '@suite-common/suite-utils';

import {
    FETCH_CHECK_INTERVAL_IN_MS,
    FETCH_CHECK_INTERVAL_IN_MS_MOBILE,
    FETCH_INTERVAL_IN_MS,
    FETCH_INTERVAL_IN_MS_MOBILE,
} from './constants';

type ConfigPollerParams = {
    isMobile: boolean;
};

type IsConfigFetchDueParams = ConfigPollerParams & {
    /** The local config is bundled, so it is never fetched and a switch to it applies at once. */
    isLocalConfig: boolean;
    lastFetchTimestamp: number;
};

export const isConfigFetchDue = ({
    isLocalConfig,
    lastFetchTimestamp,
    isMobile,
}: IsConfigFetchDueParams) => {
    if (isLocalConfig) {
        return true;
    }

    const fetchInterval = isMobile ? FETCH_INTERVAL_IN_MS_MOBILE : FETCH_INTERVAL_IN_MS;

    return Date.now() >= lastFetchTimestamp + fetchInterval;
};

export type ConfigPoller = {
    /** Runs the acquisition once and then keeps it running on the check interval. */
    start: (acquireConfig: () => Promise<void>) => Promise<void>;
    stop: () => void;
};

/**
 * Owns the config acquisition loop. The check interval is shorter than the fetch interval because
 * a tick only decides whether a fetch is due (see `isConfigFetchDue`), which keeps the loop
 * responsive to a source change without fetching more often.
 */
export const createConfigPoller = ({ isMobile }: ConfigPollerParams): ConfigPoller => {
    const polling = new PollingController();
    const checkInterval = isMobile ? FETCH_CHECK_INTERVAL_IN_MS_MOBILE : FETCH_CHECK_INTERVAL_IN_MS;

    return {
        start: acquireConfig => polling.restart(acquireConfig, checkInterval),
        stop: () => polling.stop(),
    };
};
