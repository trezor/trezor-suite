import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { useDidUpdate } from '@trezor/react-utils';

import { onBeforePopState, onLocationChange } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { setLocation, setNavigate } from './navigationService';

export const RouterHandler = () => {
    const routerLoaded = useSelector(state => state.router.loaded);
    const dispatch = useDispatch();

    const location = useLocation();
    const navigate = useNavigate();

    useDidUpdate(() => {
        // Let router to be initialized properly
        if (routerLoaded) {
            // Handle browser navigation (back button)
            const url = location.pathname + location.hash;
            dispatch(onLocationChange(url));
        }
    }, [dispatch, location.pathname, location.hash]);

    // Make navigate available globally (useful in actions)
    useEffect(() => {
        setNavigate(navigate);
    }, [navigate]);

    // Make location available globally (useful in actions)
    useEffect(() => {
        setLocation(location);
    }, [location]);

    useEffect(() => {
        const onPopState = () => {
            const canGoBack = dispatch(onBeforePopState());
            if (!canGoBack) {
                navigate(1);
            }
        };

        window.addEventListener('popstate', onPopState);

        return () => window.removeEventListener('popstate', onPopState);
    }, [dispatch, navigate]);

    return null;
};
