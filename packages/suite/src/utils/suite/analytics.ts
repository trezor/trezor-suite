import { AppState } from '@suite-types';

import { AnalyticsEvent } from '@suite-actions/analyticsActions';

type Common = Pick<AppState['analytics'], 'instanceId' | 'sessionId'> & { version: string };

/**
encodeDataToQueryString method encodes analytics data to querystring in expected format
common properties are prefixed with "c" as common to avoid identifiers collisions
*/
export const encodeDataToQueryString = (event: AnalyticsEvent, common: Common) => {
    const { type } = event;
    const { version, sessionId, instanceId } = common;
    const params = new URLSearchParams({
        // eslint-disable @typescript-eslint/naming-convention
        c_v: version,
        c_type: type || '',
        c_commit: process.env.COMMITHASH || '',
        c_instance_id: instanceId || '',
        c_session_id: sessionId || '',
        c_timestamp: Date.now().toString(),
        // eslint-enable @typescript-eslint/naming-convention
    });

    if ('payload' in event) {
        Object.entries(event.payload).forEach(([key, value]) =>
            params.append(key, value?.toString() ?? ''),
        );
    }

    return params.toString();
};
