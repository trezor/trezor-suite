import { Suspense } from 'react';

import { closeModalAppThunk } from '@suite/router';
import { ModalSkeleton } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';
import { type ForegroundAppRoute, getForegroundApp } from '@trezor/suite';

type ForegroundAppModalProps = {
    app: ForegroundAppRoute['app'];
    cancelable: boolean;
};

/** Modals (foreground applications) initiated by redux state.router.route */
export const ForegroundAppModal = ({ app, cancelable }: ForegroundAppModalProps) => {
    const { dispatch } = useServices(injectDispatch);

    const onCancel = () => dispatch(closeModalAppThunk());

    // check if current route is a "foreground application" marked as isForegroundApp in router config
    // display it above requested physical route (route in url) or as fullscreen app
    // pass common params to "foreground application"
    // every app is dealing with "prerequisites" and other params (like action modals) on they own.
    const ForegroundApp = getForegroundApp(app);

    return (
        ForegroundApp && (
            <Suspense fallback={<ModalSkeleton />}>
                <ForegroundApp cancelable={cancelable} onCancel={onCancel} />
            </Suspense>
        )
    );
};
