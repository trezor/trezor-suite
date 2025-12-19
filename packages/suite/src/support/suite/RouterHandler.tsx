import { useEffect } from 'react';

import { Action } from 'history';

import type { RouterServices } from '@suite-common/redux-utils';

import { onBeforePopState, onLocationChange } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const RouterHandler = ({ routerServices }: { routerServices: RouterServices }) => {
    const dispatch = useDispatch();
    const routerLoaded = useSelector(state => state.router.loaded);

    useEffect(() => {
        const emitLocation = () => {
            if (routerLoaded) {
                const location = routerServices.getLocation();
                dispatch(onLocationChange(location));
            }
        };

        // initial sync
        emitLocation();

        const unlisten = routerServices.listen(update => {
            // If back navigation is blocked, re-go forward by 1 to cancel it
            if (update.action === Action.Pop) {
                const canGoBack = dispatch(onBeforePopState());
                if (!canGoBack) {
                    history.go(1);

                    return;
                }
            }
            emitLocation();
        });

        return unlisten;
    }, [dispatch, routerLoaded, routerServices]);

    return null;
};

RouterHandler.displayName = 'RouterHandler';
