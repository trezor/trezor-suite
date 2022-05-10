import { useEffect } from 'react';

import { useLocation } from 'react-router-dom';
import { useActions } from '@suite-hooks/useActions';
import * as routerActions from '@suite-actions/routerActions';
import history from '@suite/support/history';
import { useOnce } from '@suite-hooks';

const RouterComponent = () => {
    const isFirstRender = useOnce(true, false);

    const location = useLocation();
    const { onLocationChange, onBeforePopState } = useActions({
        onLocationChange: routerActions.onLocationChange,
        onBeforePopState: routerActions.onBeforePopState,
    });

    useEffect(() => {
        // Let router to be initialized properly
        if (!isFirstRender) {
            // Handle browser navigation (back button)
            const url = location.pathname + location.hash;
            onLocationChange(url);
        }
    }, [location.pathname, location.hash, onLocationChange, isFirstRender]);

    useEffect(() => {
        const onPopState = () => {
            const canGoBack = onBeforePopState();
            if (!canGoBack) {
                history.go(1);
            }
        };

        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, [onBeforePopState]);

    return null;
};

export default RouterComponent;
