import * as Sentry from '@sentry/minimal';
import { allowReportTag } from '@suite-config/sentry';
import type { TransportEvent } from 'trezor-connect';

export const allowSentryReport = (value: boolean) => {
    Sentry.configureScope(scope => {
        scope.setTag(allowReportTag, value);
    });
};

export const setSentryUser = (instanceId: string) => {
    Sentry.configureScope(scope => {
        scope.setUser({ id: instanceId });
    });
};

export const unsetSentryUser = () => {
    Sentry.configureScope(scope => {
        scope.setUser(null);
    });
};

export const setSentryTransport = (transportEvent: TransportEvent) => {
    if (transportEvent.type === 'transport-start') {
        const { type, version } = transportEvent.payload;
        Sentry.configureScope(scope => {
            // todo: probably merge with already existing context? does it have callback fn sig?
            scope.setContext('suiteState', {
                // todo: something like this?
                // ...scope.getContext('suiteState'),
                transport: { type, version },
            });
        });
    }
};

// todo: also unset? probably not needed
