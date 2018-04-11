/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as NOTIFICATION from '../../actions/constants/notification';


export const Notification = (props: any) => {
    const className = `notification ${ props.className }`;


    const actionButtons = !props.actions ? null : props.actions.map((a, i) => {
        return (
            <button key={ i } onClick={ event => { props.close(); a.callback(); } } className="transparent">{ a.label }</button>
        )
    });

    return (
        <div className={ className }>
            { props.cancelable ? (
                <button className="notification-close transparent" 
                    onClick={ event => props.close() }></button>
            ) : null }
            <div className="notification-body">
                <h2>{ props.title }</h2>
                { props.message ? (<p dangerouslySetInnerHTML={{__html: props.message }}></p>) : null }
            </div>
            { props.actions && props.actions.length > 0 ? (
                <div className="notification-action">
                    { actionButtons }
                </div>
            ) : null }

        </div>
    )
}

export const NotificationGroup = (props: any) => {
    const { notifications, close } = props;
    return notifications.map((n, i) => {
        return (
            <Notification 
                key={i}
                className={ n.type }
                title={ n.title }
                message={ n.message }
                cancelable={ n.cancelable }
                actions={ n.actions }
                close={ close }
                />
        )
    });
}

export default connect( 
    (state) => {
        return {
            notifications: state.notifications
        };
    },
    (dispatch) => {
        return { 
            close: bindActionCreators((notif) => {
                return {
                    type: NOTIFICATION.CLOSE,
                    payload: notif
                }
            }, dispatch),
        };
    }
)(NotificationGroup);