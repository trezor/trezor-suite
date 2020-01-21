import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as notificationActions from '@suite-actions/notificationActions';

import StaticNotifications from './components/Static';
import AccountNotifications from './components/Account';
import ActionNotifications from './components/Action';
import { AppState, Dispatch } from '@suite-types';

const mapStateToProps = (state: AppState) => ({
    notifications: state.notifications,
    selectedAccount: state.wallet.selectedAccount,
    blockchain: state.wallet.blockchain,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    close: bindActionCreators(notificationActions.close, dispatch),
    // blockchainReconnect: bindActionCreators(reconnect, dispatch),
});

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const Notifications = (props: Props) => (
    <>
        <StaticNotifications {...props} />
        <AccountNotifications {...props} />
        <ActionNotifications {...props} />
    </>
);

export default connect(mapStateToProps, mapDispatchToProps)(Notifications);
