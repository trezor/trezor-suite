import { useEffect } from 'react';

import { Action, type History, type Update as HistoryUpdate } from 'history';

import { onBeforePopState, onLocationChange } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const RouterHandler = ({ history }: { history: History }) => {
    const dispatch = useDispatch();
    const routerLoaded = useSelector(state => state.router.loaded);

    useEffect(() => {
        const emitLocation = () => {
            if (routerLoaded) {
                const { pathname, hash } = history.location;
                dispatch(onLocationChange(pathname + hash));
            }
        };

        // initial sync
        emitLocation();

        const unlisten = history.listen((update: HistoryUpdate) => {
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
    }, [dispatch, routerLoaded, history]);

    return null;
};

RouterHandler.displayName = 'RouterHandler';
