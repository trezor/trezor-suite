import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { useSelector, useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';
import history from '@suite/support/history';

const RouterComponent = () => {
    const { storageLoaded } = useSelector(state => ({
        storageLoaded: state.suite.storageLoaded,
    }));

    const location = useLocation();
    const { onLocationChange, onBeforePopState } = useActions({
        onLocationChange: routerActions.onLocationChange,
        onBeforePopState: routerActions.onBeforePopState,
    });

    useEffect(() => {
        // Let router to be initialized properly
        if (storageLoaded) {
            // Handle browser navigation (back button)
            const url = location.pathname + location.hash;
            onLocationChange(url);
        }
    }, [location.pathname, location.hash, onLocationChange, storageLoaded]);

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
