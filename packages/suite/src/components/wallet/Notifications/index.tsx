import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { AppState, Dispatch } from '@suite-types/index';

// import { reconnect } from 'actions/DiscoveryActions';
import * as NotificationActions from '@wallet-actions/notificationActions';

import StaticNotifications from './components/Static';
import AccountNotifications from './components/Account';
import ActionNotifications from './components/Action';

interface Props {
    router: AppState['router'];
    notifications: AppState['wallet']['notifications'];
    selectedAccount: any; // TODO
    wallet: AppState['wallet'];
    blockchain: AppState['wallet']['blockchain'];
    children?: React.ReactNode;
    close: typeof NotificationActions.close;
    // blockchainReconnect: typeof reconnect;
}

const Notifications = (props: Props) => (
    <React.Fragment>
        <StaticNotifications router={props.router} />
        <AccountNotifications blockchain={[]} />
        <ActionNotifications notifications={props.notifications} close={props.close} />
    </React.Fragment>
);

const mapStateToProps = (state: AppState) => ({
    router: state.router,
    notifications: state.wallet.notifications,
    selectedAccount: state.selectedAccount,
    wallet: state.wallet,
    blockchain: state.blockchain,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    close: bindActionCreators(NotificationActions.close, dispatch),
    // blockchainReconnect: bindActionCreators(reconnect, dispatch),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Notifications);
