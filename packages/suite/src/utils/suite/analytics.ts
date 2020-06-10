import qs from 'qs';
import { AppState } from '@suite-types';

import { AnalyticsEvent } from '@suite-actions/analyticsActions';

type Common = Pick<AppState['analytics'], 'instanceId' | 'sessionId'>;

// type EventWithPayload = AnalyticsEvent & { payload: any };

// function isEventWithPayload(event: Fish | Bird): pet is Fish {
//     return (pet as Fish).swim !== undefined;
// }

export const encodeDataToQueryString = (event: AnalyticsEvent, common: Common) => {
    const { eventType } = event;
    // watched data is sent in query string
    const commonEncoded = qs.stringify({
        // simple semver for data-analytics part.
        // <breaking-change>.<analytics-extended>
        v: '1.0',
        commit: process.env.COMMITHASH,
        eventType,
        ...common,
    });

    if ('payload' in event) {
        const eventSpecificEncoded = qs.stringify(event.payload, {
            arrayFormat: 'comma',
        });
        return `${commonEncoded}&${eventSpecificEncoded}`;
    }

    return commonEncoded;
};
