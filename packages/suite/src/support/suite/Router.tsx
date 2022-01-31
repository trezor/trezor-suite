import { useEffect } from 'react';

import { useActions } from '@suite-hooks/useActions';
import { onLocationChange, onBeforePopState } from '@suite-actions/routerActions';
import history from '@suite/support/history';

const RouterComponent = () => {
    const actions = useActions({
        onLocationChange,
        onBeforePopState,
    });

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
