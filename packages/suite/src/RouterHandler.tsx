import { useEffect, FunctionComponent } from 'react';
import { Store } from 'redux';
import Router from 'next/router';

import { onLocationChange } from '@suite/actions/RouterActions';
import { State, Action } from '@suite/types';

interface Props {
    store: Store<State, Action>;
}

const RouterController: FunctionComponent<Props> = ({ store }) => {
    const { dispatch, getState } = store;
    useEffect(() => {
        const dispatchLocationChange = (pathname: string) => {
            dispatch(onLocationChange(pathname));
        };
        const onHashChanged = () => {
            // TODO: check if the view is not locked by the device request
            const { router } = getState();
            const windowPath = window.location.pathname + window.location.hash;
            if (router.pathname !== windowPath) {
                dispatchLocationChange(windowPath);
            }
        };

        // handle browser back button
        Router.beforePopState(() => {
            // TODO: check if the view is not locked by the device request
            const blocked = false;
            if (blocked) {
                // if (route.as !== '/wallet') {
                // do not render if view is locked
                return false;
            }
            return true;
        });

        // handle hash changed (by hand)
        // check if the view is not locked by the device request
        window.addEventListener('hashchange', onHashChanged, false);

        Router.events.on('routeChangeComplete', dispatchLocationChange);
        Router.events.on('hashChangeComplete', dispatchLocationChange);

        // set initial location
        dispatchLocationChange(Router.pathname + window.location.hash);

        return () => {
            window.removeEventListener('hashchange', onHashChanged, false);
            Router.events.off('routeChangeComplete', dispatchLocationChange);
            Router.events.off('hashChangeComplete', dispatchLocationChange);
        };
    }, [dispatch, getState]);

    return null;
};

export default RouterController;
