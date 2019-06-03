/* @flow */
import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';

import type { State, Dispatch } from 'flowtype';

import * as NotificationActions from 'actions/NotificationActions';
import * as RouterActions from 'actions/RouterActions';

import type { intlShape } from 'react-intl';
import OnlineStatus from './components/OnlineStatus';
import UpdateBridge from './components/UpdateBridge';
import UpdateFirmware from './components/UpdateFirmware';
import NoBackup from './components/NoBackup';

type OwnProps = {|
    intl: intlShape,
|};

export type StateProps = {|
    connect: $ElementType<State, 'connect'>,
    wallet: $ElementType<State, 'wallet'>,
    children?: React.Node,
|};

export type DispatchProps = {|
    close: typeof NotificationActions.close,
    routerActions: typeof RouterActions,
|};

export type Props = {| ...OwnProps, ...StateProps, ...DispatchProps |};

const Notifications = (props: Props) => (
    <React.Fragment>
        <OnlineStatus {...props} />
        <UpdateBridge {...props} />
        <UpdateFirmware {...props} />
        <NoBackup {...props} />
    </React.Fragment>
);

const mapStateToProps = (state: State): StateProps => ({
    connect: state.connect,
    wallet: state.wallet,
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
    close: bindActionCreators(NotificationActions.close, dispatch),
    routerActions: bindActionCreators(RouterActions, dispatch),
});

export default injectIntl(
    connect<Props, OwnProps, StateProps, DispatchProps, State, Dispatch>(
        mapStateToProps,
        mapDispatchToProps
    )(Notifications)
);
