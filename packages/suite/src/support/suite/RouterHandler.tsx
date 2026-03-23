import { useEffect } from 'react';

import { Action } from 'history';

import { onLocationChange, selectCanNavigate, selectRouterLoaded } from '@suite/router';

import { useDispatch, useSelector } from 'src/hooks/suite';

import { useSuiteServices } from '../SuiteServicesProvider';

export const RouterHandler = () => {
    const dispatch = useDispatch();
    const routerLoaded = useSelector(selectRouterLoaded);
    const { suiteRouterHistory } = useSuiteServices();
    const canGoBack = useSelector(selectCanNavigate);

    useEffect(() => {
        const emitLocation = () => {
            if (routerLoaded) {
                const location = suiteRouterHistory.getLocation();
                dispatch(onLocationChange(location));
            }
        };

        // initial sync
        emitLocation();

        const unlisten = suiteRouterHistory.listen(update => {
            // If back navigation is blocked, re-go forward by 1 to cancel it
            if (update.action === Action.Pop) {
                if (!canGoBack) {
                    history.go(1);

                    return;
                }
            }
            emitLocation();
        });

        return unlisten;
    }, [canGoBack, dispatch, routerLoaded, suiteRouterHistory]);

    return null;
};

RouterHandler.displayName = 'RouterHandler';
