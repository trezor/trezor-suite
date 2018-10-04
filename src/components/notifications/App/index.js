/* @flow */
import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import type { State, Dispatch } from 'flowtype';

import * as NotificationActions from 'actions/NotificationActions';
import * as RouterActions from 'actions/RouterActions';

import OnlineStatus from './components/OnlineStatus';
import UpdateBridge from './components/UpdateBridge';
import UpdateFirmware from './components/UpdateFirmware';

export type StateProps = {
    connect: $ElementType<State, 'connect'>;
    wallet: $ElementType<State, 'wallet'>;
    children?: React.Node;
}

export type DispatchProps = {
    close: typeof NotificationActions.close;
    routerActions: typeof RouterActions;
}

export type Props = StateProps & DispatchProps;

type OwnProps = {};

const Notifications = (props: Props) => (
    <React.Fragment>
        <OnlineStatus {...props} />
        <UpdateBridge {...props} />
        <UpdateFirmware {...props} />
    </React.Fragment>
);

const mapStateToProps: MapStateToProps<State, OwnProps, StateProps> = (state: State): StateProps => ({
    connect: state.connect,
    wallet: state.wallet,
});

const mapDispatchToProps: MapDispatchToProps<Dispatch, OwnProps, DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
    close: bindActionCreators(NotificationActions.close, dispatch),
    routerActions: bindActionCreators(RouterActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Notifications);