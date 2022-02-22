import * as Sentry from '@sentry/minimal';
import { allowReportTag } from '@suite-config/sentry';

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
