import { useEffect } from 'react';

import { useLocation } from 'react-router-dom';
import { useDidUpdate } from '@trezor/react-utils';
import { useActions } from '@suite-hooks/useActions';
import * as routerActions from '@suite-actions/routerActions';
import { history } from '@suite-common/suite-support';
import { useSelector } from '@suite-hooks';

const RouterComponent = () => {
    const { routerLoaded } = useSelector(state => ({
        routerLoaded: state.router.loaded,
    }));

    const location = useLocation();
    const { onLocationChange, onBeforePopState } = useActions({
        onLocationChange: routerActions.onLocationChange,
        onBeforePopState: routerActions.onBeforePopState,
    });

    useDidUpdate(() => {
        // Let router to be initialized properly
        if (routerLoaded) {
            // Handle browser navigation (back button)
            const url = location.pathname + location.hash;
            onLocationChange(url);
        }
    }, [location.pathname, location.hash, onLocationChange]);

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
