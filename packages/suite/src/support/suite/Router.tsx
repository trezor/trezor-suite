import { useEffect, FunctionComponent } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Router from 'next/router';

import { onLocationChange, onBeforePopState } from '@suite-actions/routerActions';
import { Dispatch } from '@suite-types/index';

/**
 * Router handler for 'next/router' used in suite-web and suite-desktop apps
 * next/router and window event handlers needs to be wrapped inside component "onMount" event (useEffect) otherwise next.js compilation fail with error
 *
 * Handle changes of Router and window.location.hash and dispatch Action with current url to reducer
 * Optionally block render process if UI is locked by device request
 * @param {*} { store }
 * @returns null
 */
const RouterHandler: FunctionComponent<Props> = ({ onLocationChange, onBeforePopState }) => {
    useEffect(() => {
        const onHashChanged = () => {
            // TODO: check if the view is not locked by the device request
            const windowPath = window.location.pathname + window.location.hash;
            onLocationChange(windowPath);
        };

        // handle browser back button
        Router.beforePopState(() => {
            const locked = onBeforePopState();
            return locked;
        });

        // handle hash changed (by hand)
        // check if the view is not locked by the device request
        window.addEventListener('hashchange', onHashChanged, false);

        Router.events.on('routeChangeComplete', onLocationChange);
        Router.events.on('hashChangeComplete', onLocationChange);

        return () => {
            window.removeEventListener('hashchange', onHashChanged, false);
            Router.events.off('routeChangeComplete', onLocationChange);
            Router.events.off('hashChangeComplete', onLocationChange);
        };
    }, [onLocationChange, onBeforePopState]);

    return null;
};

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            onLocationChange,
            onBeforePopState,
        },
        dispatch,
    );

type Props = ReturnType<typeof mapDispatchToProps>;

export default connect(
    null,
    mapDispatchToProps,
)(RouterHandler);
