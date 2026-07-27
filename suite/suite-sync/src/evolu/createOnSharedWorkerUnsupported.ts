import { type Dispatch } from '@reduxjs/toolkit';

import { notificationsActions } from '@suite-common/toast-notifications';

type CreateOnSharedWorkerUnsupportedDeps = {
    dispatch: Dispatch;
};

export const createOnSharedWorkerUnsupported =
    (deps: CreateOnSharedWorkerUnsupportedDeps) => () => {
        console.error('Suite Sync shared worker is unsupported in this tab.');

        deps.dispatch(
            notificationsActions.addToast({
                type: 'error',
                error: 'This browser supports Suite Sync in one tab only. Close this tab and use the already open tab please.',
            }),
        );
    };
