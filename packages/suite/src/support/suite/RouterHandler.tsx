import { memo, useEffect } from 'react';

import type { History } from 'history';

import { onBeforePopState, onLocationChange } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';

export const RouterHandler = memo(({ history }: { history: History }) => {
    const dispatch = useDispatch();

    useEffect(
        () =>
            history.listen(() =>
                dispatch(onLocationChange(history.location.pathname + history.location.hash)),
            ),
        [dispatch, history],
    );

    useEffect(() => {
        const onPopState = () => {
            const canGoBack = dispatch(onBeforePopState());
            if (!canGoBack) {
                history.go(1);
            }
        };

        window.addEventListener('popstate', onPopState);

        return () => window.removeEventListener('popstate', onPopState);
    }, [dispatch, history]);

    return null;
});

RouterHandler.displayName = 'RouterHandler';
