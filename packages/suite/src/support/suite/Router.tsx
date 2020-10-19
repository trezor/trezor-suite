import { useEffect, FunctionComponent } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Router from 'next/router';

import { onLocationChange, onBeforePopState } from '@suite-actions/routerActions';
import { Dispatch } from '@suite-types';

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            onLocationChange,
            onBeforePopState,
        },
        dispatch,
    );

type Props = ReturnType<typeof mapDispatchToProps>;

/**
 * Router handler for 'next/router' used in suite-web and suite-desktop apps
 * next/router and window event handlers needs to be wrapped inside component "onMount" event (useEffect) otherwise next.js compilation fail with error
 *
 * Handle changes of Router and window.location.hash and dispatch Action with current url to reducer
 * Optionally block render process if UI is locked by device request
 * @param {*} { store }
 * @returns null
 */
const RouterComponent: FunctionComponent<Props> = (props: Props) => {
    useEffect(() => {
        const onHashChanged = () => {
            // TODO: check if the view is not locked by the device request
            const windowPath = window.location.pathname + window.location.hash;
            props.onLocationChange(windowPath);
        };

        // handle browser back button
        Router.beforePopState(() => {
            const locked = props.onBeforePopState();
            // noinspection SuspiciousTypeOfGuard
            return typeof locked === 'boolean' ? locked : true;
        });

        // handle hash changed (by hand)
        // check if the view is not locked by the device request
        window.addEventListener('hashchange', onHashChanged, false);

        Router.events.on('routeChangeComplete', props.onLocationChange);
        Router.events.on('hashChangeComplete', props.onLocationChange);

        return () => {
            window.removeEventListener('hashchange', onHashChanged, false);
            Router.events.off('routeChangeComplete', props.onLocationChange);
            Router.events.off('hashChangeComplete', props.onLocationChange);
        };
    });

    return null;
};

export default connect(null, mapDispatchToProps)(RouterComponent);
