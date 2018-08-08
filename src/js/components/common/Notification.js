/* @flow */


import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as NOTIFICATION from '~/js/actions/constants/notification';
import * as NotificationActions from '~/js/actions/NotificationActions';
import type { Action, State, Dispatch } from '~/flowtype';
import Loader from './LoaderCircle';

type Props = {
    notifications: $ElementType<State, 'notifications'>,
    close: (notif?: any) => Action
}

type NProps = {
    key?: number;
    className: string;
    cancelable?: boolean;
    title: string;
    message?: string;
    actions?: Array<any>;
    close?: typeof NotificationActions.close,
    loading?: boolean
}

export const Notification = (props: NProps): React$Element<string> => {
    const className = `notification ${props.className}`;
    const close: Function = typeof props.close === 'function' ? props.close : () => {}; // TODO: add default close action
    const actionButtons = props.actions ? props.actions.map((a, i) => (
        <button key={i} onClick={(event) => { close(); a.callback(); }} className="transparent">{ a.label }</button>
    )) : null;

    return (
        <div className={className}>
            { props.cancelable ? (
                <button
                    className="notification-close transparent"
                    onClick={event => close()}
                />
            ) : null }
            <div className="notification-body">
                <h2>{ props.title }</h2>
                { props.message ? (<p dangerouslySetInnerHTML={{ __html: props.message }} />) : null }
            </div>
            { props.actions && props.actions.length > 0 ? (
                <div className="notification-action">
                    { actionButtons }
                </div>
            ) : null }
            { props.loading ? (
                <Loader
                    className="info"
                    size="50" />
            ) : null }

        </div>
    );
};

export const NotificationGroup = (props: Props) => {
    const { notifications, close } = props;
    return notifications.map((n, i) => (
        <Notification
            key={i}
            className={n.type}
            title={n.title}
            message={n.message}
            cancelable={n.cancelable}
            actions={n.actions}
            close={close}
        />
    ));
};

export default connect(
    (state: State) => ({
        notifications: state.notifications,
    }),
    (dispatch: Dispatch) => ({
        close: bindActionCreators(NotificationActions.close, dispatch),
    }),
)(NotificationGroup);