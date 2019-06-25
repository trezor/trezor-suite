import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { State, Dispatch } from '@suite-types/index';

// import { reconnect } from 'actions/DiscoveryActions';
import * as NotificationActions from '@wallet-actions/NotificationActions';

import StaticNotifications from './components/Static';
import AccountNotifications from './components/Account';
import ActionNotifications from './components/Action';

interface Props {
    router: State['router'];
    notifications: State['wallet']['notifications'];
    selectedAccount: any; // TODO
    wallet: State['wallet'];
    blockchain: State['wallet']['blockchain'];
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

const mapStateToProps = (state: State) => ({
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
