import { events } from '@suite-common/analytics';
import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { thpActions } from '@suite-common/thp';

export const thpMiddleware = createMiddlewareWithExtraDeps((action, { next, extra }) => {
    if (thpActions.finishThpFlow.match(action)) {
        extra.services.analytics.report({
            type: events.deviceConnectionDeviceConfirmationEvent.name,
            payload: {
                option: 'confirmed',
            },
        });
    }
    if (thpActions.cancelThpFlow.match(action)) {
        extra.services.analytics.report({
            type: events.deviceConnectionDeviceConfirmationEvent.name,
            payload: {
                option: 'close',
            },
        });
    }

    return next(action);
});
