import { useEffect } from 'react';

import { Action } from 'history';

import {
    onLocationChangeThunk,
    selectCanNavigate,
    selectRouterLoaded,
    selectSuiteRouterHistoryDep,
} from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { useDispatch } from '@suite-common/redux-utils';

import { useSelector } from 'src/hooks/suite';

export const RouterHandler = () => {
    const dispatch = useDispatch();
    const routerLoaded = useSelector(selectRouterLoaded);
    const { suiteRouterHistory } = useServices(selectSuiteRouterHistoryDep);
    const canGoBack = useSelector(selectCanNavigate);

    useEffect(() => {
        const emitLocation = () => {
            if (routerLoaded) {
                const location = suiteRouterHistory.getLocation();
                dispatch(onLocationChangeThunk(location));
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
