import React, { useEffect } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import * as notificationActions from '@suite-actions/notificationActions';
import { AppState, Dispatch } from '@suite-types';

const mapStateToProps = (state: AppState) => ({
    notifications: state.notifications,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    close: bindActionCreators(notificationActions.close, dispatch),
});

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const getContent = (notification: any) => {
    switch (notification.type) {
        case 'auth-confirm-error':
            return notification.error;
        case 'copy-to-clipboard-success':
            return `Copied to clipboard. ${notification.payload ? notification.payload : ''}`;
        case 'copy-to-clipboard-error':
            return notification.error;
        case 'verify-address-error':
            return notification.error;
        default:
            return notification.type;
    }
};

const Notifications = ({ notifications, close }: Props) => {
    useEffect(() => {
        notifications
            .filter(n => !n.hidden)
            .forEach(n => {
                // const exists = Object.keys(state).find(k => k === n.key);
                const shouldBeDisplayed = !toast.isActive(n.id);
                if (shouldBeDisplayed) {
                    toast(getContent(n), {
                        position: 'bottom-center',
                        toastId: n.id,
                        onClose: () => close(n.id),
                    });
                }
            });
    }, [close, notifications]);

    return <ToastContainer />;
};

export default connect(mapStateToProps, mapDispatchToProps)(Notifications);
