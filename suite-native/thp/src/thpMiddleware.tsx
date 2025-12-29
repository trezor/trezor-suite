import { EventType } from '@suite-common/analytics-types';
import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { thpActions } from '@suite-common/thp';

export const thpMiddleware = createMiddlewareWithExtraDeps((action, { next, extra }) => {
    if (thpActions.finishThpFlow.match(action)) {
        extra.services.legacyAnalytics.report({
            type: EventType.DeviceConnectionDeviceConfirmation,
            payload: {
                option: 'confirmed',
            },
        });
    }
    if (thpActions.cancelThpFlow.match(action)) {
        extra.services.legacyAnalytics.report({
            type: EventType.DeviceConnectionDeviceConfirmation,
            payload: {
                option: 'close',
            },
        });
    }

    return next(action);
});
