import qs from 'qs';
import { AppState } from '@suite-types';

import { Payload } from '@suite-actions/analyticsActions';

type Common = Pick<AppState['analytics'], 'instanceId' | 'sessionId'>;

export const encodeDataToQueryString = (data: Payload, common: Common) => {
    // watched data is sent in query string
    const commonEncoded = qs.stringify({
        // simple semver for data-analytics part.
        // <breaking-change>.<analytics-extended>
        v: '1.0',
        commit: process.env.COMMITHASH,
        ...common,
    });

    let eventSpecificEncoded;
    if (typeof data.payload !== 'string') {
        eventSpecificEncoded = qs.stringify(
            {
                eventType: data.eventType,
                ...data.payload,
            },
            {
                arrayFormat: 'comma',
            },
        );
    } else {
        eventSpecificEncoded = qs.stringify({
            eventType: data.eventType,
            payload: data.payload,
        });
    }

    return `${commonEncoded}&${eventSpecificEncoded}`;
};
