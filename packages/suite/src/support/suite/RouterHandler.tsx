import { useEffect } from 'react';

import { Action } from 'history';

import { selectRouterLoaded } from '@suite/router';

import { onBeforePopState, onLocationChange } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { useSuiteServices } from '../SuiteServicesProvider';

export const RouterHandler = () => {
    const dispatch = useDispatch();
    const routerLoaded = useSelector(selectRouterLoaded);
    const { suiteRouterHistory } = useSuiteServices();

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
                const canGoBack = dispatch(onBeforePopState());
                if (!canGoBack) {
                    history.go(1);

                    return;
                }
            }
            emitLocation();
        });

        return unlisten;
    }, [dispatch, routerLoaded, suiteRouterHistory]);

    return null;
};

RouterHandler.displayName = 'RouterHandler';
