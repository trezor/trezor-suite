import qs from 'qs';
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
    const commonEncoded = qs.stringify({
        // eslint-disable-next-line @typescript-eslint/camelcase
        c_v: version,
        // eslint-disable-next-line @typescript-eslint/camelcase
        c_type: type,
        // eslint-disable-next-line @typescript-eslint/camelcase
        c_commit: process.env.COMMITHASH,
        // eslint-disable-next-line @typescript-eslint/camelcase
        c_instance_id: instanceId,
        // eslint-disable-next-line @typescript-eslint/camelcase
        c_session_id: sessionId,
    });

    if ('payload' in event) {
        const eventSpecificEncoded = qs.stringify(event.payload, {
            arrayFormat: 'comma',
        });
        return `${commonEncoded}&${eventSpecificEncoded}`;
    }

    return commonEncoded;
};
