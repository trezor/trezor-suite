import { createMiddleware } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';

import { dismissToast, showToast } from 'src/components/suite';

export const toastMiddleware = createMiddleware((action, { next }) => {
    if (notificationsActions.close.match(action)) {
        dismissToast(action.payload);
    }

    if (notificationsActions.addToast.match(action)) {
        showToast(action.payload);
    }

    return next(action);
});
