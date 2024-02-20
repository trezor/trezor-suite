import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { useDidUpdate } from '@trezor/react-utils';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { onBeforePopState, onLocationChange } from 'src/actions/suite/routerActions';
import history from 'src/support/history';

const RouterComponent = () => {
    const routerLoaded = useSelector(state => state.router.loaded);
    const dispatch = useDispatch();

    const location = useLocation();

    useDidUpdate(() => {
        // Let router to be initialized properly
        if (routerLoaded) {
            // Handle browser navigation (back button)
            const url = location.pathname + location.hash;
            dispatch(onLocationChange(url));
        }
    }, [dispatch, location.pathname, location.hash]);

    useEffect(() => {
        const onPopState = () => {
            const canGoBack = dispatch(onBeforePopState());
            if (!canGoBack) {
                history.go(1);
            }
        };

        window.addEventListener('popstate', onPopState);

        return () => window.removeEventListener('popstate', onPopState);
    }, [dispatch]);

    return null;
};

export default RouterComponent;
