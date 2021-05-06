import * as Sentry from '@sentry/react';

export const setSentryUser = (instanceId: string) => {
    Sentry.configureScope(scope => {
        scope.setUser({ id: instanceId });
    });
};
