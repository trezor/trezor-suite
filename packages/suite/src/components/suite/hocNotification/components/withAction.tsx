import React from 'react';
import { connect } from 'react-redux';
import { DEVICE } from 'trezor-connect';
import * as suiteActions from '@suite-actions/suiteActions';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import { Dispatch } from '@suite-types';
import { ViewProps } from '../definitions';

/**
 * HOC component for specific `state.notifications` views with actions
 * This component needs to be connected only to gain access to `store.dispatch`
 * @param {React.ComponentType<ViewProps>} View
 * @param {ViewProps} props
 */
const withAction = (View: React.ComponentType<ViewProps>, props: ViewProps) => {
    // add action callback
    const WrappedView = connect()(({ dispatch }: { dispatch: Dispatch }) => {
        const { notification } = props;
        let action: ViewProps['action'];
        switch (notification.type) {
            case 'acquire-error':
                action = () => dispatch(suiteActions.acquireDevice(notification.device));
                break;
            case 'auth-failed':
                action = () => dispatch(suiteActions.authorizeDevice());
                break;
            case 'auth-confirm-error':
                action = () => dispatch(suiteActions.authConfirm());
                break;
            case 'discovery-error':
                action = () => dispatch(discoveryActions.restart());
                break;
            case DEVICE.CONNECT:
                action = !notification.seen
                    ? () => dispatch(suiteActions.selectDevice(notification.device))
                    : undefined;
                break;
            case DEVICE.CONNECT_UNACQUIRED:
                action = !notification.seen
                    ? () => dispatch(suiteActions.acquireDevice(notification.device))
                    : undefined;
                break;
            // no default
        }
        return <View {...props} action={action} />;
    });
    return <WrappedView key={props.notification.id} />;
};

export default withAction;
