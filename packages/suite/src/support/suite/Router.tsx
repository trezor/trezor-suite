import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useActions } from '@suite-hooks/useActions';
import { onLocationChange, onBeforePopState } from '@suite-actions/routerActions';
import history from '@suite/support/history';

const RouterComponent = () => {
    const location = useLocation();
    const actions = useActions({
        onLocationChange,
        onBeforePopState,
    });

    useEffect(() => {
        const url = location.pathname + location.hash;
        actions.onLocationChange(url);
    }, [location.pathname, location.hash, actions]);

    useEffect(() => {
        const onPopState = () => {
            const canGoBack = actions.onBeforePopState();
            if (!canGoBack) {
                history.go(1);
            }
        };

        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, [actions]);

    return null;
};

export default RouterComponent;
