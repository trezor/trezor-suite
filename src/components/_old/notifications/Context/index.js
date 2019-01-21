import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { reconnect } from 'actions/DiscoveryActions';
import * as NotificationActions from 'actions/NotificationActions';

import StaticNotifications from './components/Static';
import AccountNotifications from './components/Account';
import ActionNotifications from './components/Action';

const Notifications = props => (
    <React.Fragment>
        <StaticNotifications {...props} />
        <AccountNotifications {...props} />
        <ActionNotifications {...props} />
    </React.Fragment>
);

const mapStateToProps = state => ({
    router: state.router,
    notifications: state.notifications,
    selectedAccount: state.selectedAccount,
    wallet: state.wallet,
    blockchain: state.blockchain,
});

const mapDispatchToProps = dispatch => ({
    close: bindActionCreators(NotificationActions.close, dispatch),
    blockchainReconnect: bindActionCreators(reconnect, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Notifications);