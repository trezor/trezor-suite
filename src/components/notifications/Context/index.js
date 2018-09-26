/* @flow */
import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import type { State, Dispatch } from 'flowtype';

import { reconnect } from 'actions/DiscoveryActions';
import * as NotificationActions from 'actions/NotificationActions';

import StaticNotifications from './components/Static';
import AccountNotifications from './components/Account';
import ActionNotifications from './components/Action';

export type StateProps = {
    router: $ElementType<State, 'router'>;
    notifications: $ElementType<State, 'notifications'>;
    selectedAccount: $ElementType<State, 'selectedAccount'>;
    wallet: $ElementType<State, 'wallet'>;
    blockchain: $ElementType<State, 'blockchain'>;
    children?: React.Node;
}

export type DispatchProps = {
    close: typeof NotificationActions.close;
    blockchainReconnect: typeof reconnect;
}

export type Props = StateProps & DispatchProps;

type OwnProps = {};

const Notifications = (props: Props) => (
    <React.Fragment>
        <StaticNotifications {...props} />
        <AccountNotifications {...props} />
        <ActionNotifications {...props} />
    </React.Fragment>
);

const mapStateToProps: MapStateToProps<State, OwnProps, StateProps> = (state: State): StateProps => ({
    router: state.router,
    notifications: state.notifications,
    selectedAccount: state.selectedAccount,
    wallet: state.wallet,
    blockchain: state.blockchain,
});

const mapDispatchToProps: MapDispatchToProps<Dispatch, OwnProps, DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
    close: bindActionCreators(NotificationActions.close, dispatch),
    blockchainReconnect: bindActionCreators(reconnect, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Notifications);