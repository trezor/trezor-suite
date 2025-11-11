import { createMiddleware } from '@suite-common/redux-utils';
import { thpActions } from '@suite-common/thp';
import { EventTypeShared, analytics } from '@suite-native/analytics';

export const thpMiddleware = createMiddleware((action, { next }) => {
    if (thpActions.finishThpFlow.match(action)) {
        analytics.report({
            type: EventTypeShared.DeviceConnectionDeviceConfirmation,
            payload: {
                option: 'confirmed',
            },
        });
    }
    if (thpActions.cancelThpFlow.match(action)) {
        analytics.report({
            type: EventTypeShared.DeviceConnectionDeviceConfirmation,
            payload: {
                option: 'close',
            },
        });
    }

    return next(action);
});
