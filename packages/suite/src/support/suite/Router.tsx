import { useEffect } from 'react';
import Router from 'next/router';
import { useActions } from '@suite-hooks/useActions';
import { onLocationChange, onBeforePopState } from '@suite-actions/routerActions';

/**
 * Router handler for 'next/router' used in suite-web and suite-desktop apps
 * next/router and window event handlers needs to be wrapped inside component "onMount" event (useEffect) otherwise next.js compilation fail with error
 *
 * Handle changes of Router and window.location.hash and dispatch Action with current url to reducer
 * Optionally block render process if UI is locked by device request
 * @returns null
 */

const RouterComponent = () => {
    const actions = useActions({
        onLocationChange,
        onBeforePopState,
    });
    useEffect(() => {
        const onHashChanged = () => {
            // TODO: check if the view is not locked by the device request
            const windowPath = window.location.pathname + window.location.hash;
            actions.onLocationChange(windowPath);
        };

        // handle browser back button
        Router.beforePopState(() => {
            const locked = actions.onBeforePopState();
            return typeof locked === 'boolean' ? locked : true;
        });

        // handle hash changed (by hand)
        // check if the view is not locked by the device request
        window.addEventListener('hashchange', onHashChanged, false);

        Router.events.on('routeChangeComplete', actions.onLocationChange);
        Router.events.on('hashChangeComplete', actions.onLocationChange);

        return () => {
            window.removeEventListener('hashchange', onHashChanged, false);
            Router.events.off('routeChangeComplete', actions.onLocationChange);
            Router.events.off('hashChangeComplete', actions.onLocationChange);
        };
    }, [actions]);

    return null;
};

export default RouterComponent;
