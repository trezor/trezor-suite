import { useLayoutEffect } from 'react';

import { Route } from '@suite-common/suite-types';

import * as routerActions from '../../actions/suite/routerActions';
import { useDispatch } from '../../hooks/suite';

type RedirectProps = {
    to: Route['name'];
};

/**
 * Component that does nothing else but trigger redirection.
 * This must be used instead of Redirect from react-router-dom, because we need redux state synced with react-router state!
 * @param to destination route name, as named in our route config (not necessarily the actual location.pathname)
 */
export const Redirect = ({ to }: RedirectProps) => {
    const dispatch = useDispatch();

    // useLayoutEffect rather than useEffect to prevent flickering (rendering null while redirect is in progress)
    useLayoutEffect(() => {
        dispatch(routerActions.goto(to));
    }, [dispatch, to]);

    return null;
};
