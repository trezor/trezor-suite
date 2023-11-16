import type { Environment } from '@trezor/env-utils';
import type { App, Event as AnalyticsEvent } from './types';
import { getWeakRandomId } from '@trezor/utils';

export const getTrackingRandomId = () => getWeakRandomId(10);

export const getRandomId = () => getWeakRandomId(10);

export const encodeDataToQueryString = <T extends AnalyticsEvent>(
    instanceId: string,
    sessionId: string,
    commitId: string,
    version: string,
    event: T,
) => {
    const { type, timestamp } = event;

    const params = new URLSearchParams({
        c_v: version,
        c_type: type || '',
        c_commit: commitId,
        c_instance_id: instanceId,
        c_session_id: sessionId,
        c_timestamp: timestamp || Date.now().toString(),
        c_message_id: getRandomId(),
    });

    if (event.payload) {
        Object.entries(event.payload).forEach(([key, value]) =>
            params.append(key, value?.toString() ?? ''),
        );
    }

    return params.toString();
};

export const getUrl = (app: App, isDev: boolean, environment?: Environment) => {
    let base = `https://data.trezor.io/${app}/log`;

    if (environment) {
        base = `${base}/${environment}`;
    }

    if (isDev) {
        return `${base}/develop.log`;
    }

    return `${base}/stable.log`;
};

const reportEventError = (
    type: ReportEventProps['type'],
    retry: ReportEventProps['retry'],
    err: any,
) => {
    let errorMessage = err?.error?.message || err?.message;

    if (typeof errorMessage !== 'string') {
        // this should never happen
        errorMessage = 'Unknown error.';
    }

    // to circumvent sentry inbound filter
    if (errorMessage.includes('Failed to fetch')) {
        errorMessage = 'Failed to analytics fetch.';
    }

    const reportedMessage = `Analytics report failed. Reporting '${type}' ${
        retry ? 'again' : 'was unsuccessful'
    }. ${errorMessage}`;

    console.error(reportedMessage);
};

interface ReportEventProps {
    type: AnalyticsEvent['type'];
    url: string;
    options: RequestInit;
    retry: boolean;
}

export const reportEvent = async ({ type, url, options, retry }: ReportEventProps) => {
    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            console.error(`Analytics response not ok. Response status: ${response.status}.`);
        }
    } catch (err) {
        reportEventError(type, retry, err);

        if (retry) {
            setTimeout(() => reportEvent({ type, url, options, retry: false }), 1000);
        }
    }
};
