import { getWeakRandomId } from '@trezor/utils';

import type { App, Environment, Event } from './types';

export const getRandomId = () => getWeakRandomId(10);

export const getUrl = (app: App, environment: Environment, isDev: boolean) => {
    const base = `https://data.trezor.io/${app}/log/${environment}`;

    if (isDev) {
        return `${base}/develop.log`;
    }

    return `${base}/stable.log`;
};

export const encodeDataToQueryString = <T extends Event>(
    instanceId: string,
    sessionId: string,
    commitId: string,
    version: string,
    event: T,
) => {
    const { type } = event;

    const params = new URLSearchParams({
        c_v: version,
        c_type: type || '',
        c_commit: commitId,
        c_instance_id: instanceId,
        c_session_id: sessionId,
        c_timestamp: Date.now().toString(),
    });

    if (event.payload) {
        Object.entries(event.payload).forEach(([key, value]) =>
            params.append(key, value?.toString() ?? ''),
        );
    }

    return params.toString();
};
