import React from 'react';
import { connect } from 'react-redux';
import { DEVICE } from 'trezor-connect';
import * as suiteActions from '@suite-actions/suiteActions';
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
            case DEVICE.CONNECT:
                action = {
                    label: 'TR_SELECT_DEVICE',
                    onClick: () =>
                        !notification.seen
                            ? dispatch(suiteActions.selectDevice(notification.device))
                            : undefined,
                };
                break;
            case DEVICE.CONNECT_UNACQUIRED:
                action = {
                    label: 'TR_SOLVE_ISSUE',
                    onClick: () =>
                        !notification.seen
                            ? dispatch(suiteActions.acquireDevice(notification.device))
                            : undefined,
                };
                break;
            // no default
        }
        return <View {...props} action={action} />;
    });
    return <WrappedView key={props.notification.id} />;
};

export default withAction;
