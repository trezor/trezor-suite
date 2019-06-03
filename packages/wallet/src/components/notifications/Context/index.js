/* @flow */
import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import type { IntlShape } from 'react-intl';

import type { State, Dispatch } from 'flowtype';

import { reconnect } from 'actions/DiscoveryActions';
import * as NotificationActions from 'actions/NotificationActions';

import StaticNotifications from './components/Static';
import AccountNotifications from './components/Account';
import ActionNotifications from './components/Action';

type OwnProps = {|
    intl: IntlShape,
|};

export type StateProps = {|
    router: $ElementType<State, 'router'>,
    notifications: $ElementType<State, 'notifications'>,
    selectedAccount: $ElementType<State, 'selectedAccount'>,
    wallet: $ElementType<State, 'wallet'>,
    blockchain: $ElementType<State, 'blockchain'>,
    children?: React.Node,
|};

export type DispatchProps = {|
    close: typeof NotificationActions.close,
    blockchainReconnect: typeof reconnect,
|};

export type Props = {| ...OwnProps, ...StateProps, ...DispatchProps |};

const Notifications = (props: Props) => (
    <React.Fragment>
        <StaticNotifications {...props} />
        <AccountNotifications {...props} />
        <ActionNotifications {...props} />
    </React.Fragment>
);

const mapStateToProps = (state: State): StateProps => ({
    router: state.router,
    notifications: state.notifications,
    selectedAccount: state.selectedAccount,
    wallet: state.wallet,
    blockchain: state.blockchain,
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
    close: bindActionCreators(NotificationActions.close, dispatch),
    blockchainReconnect: bindActionCreators(reconnect, dispatch),
});

export default injectIntl<OwnProps>(
    connect<Props, OwnProps, StateProps, DispatchProps, State, Dispatch>(
        mapStateToProps,
        mapDispatchToProps
    )(Notifications)
);
